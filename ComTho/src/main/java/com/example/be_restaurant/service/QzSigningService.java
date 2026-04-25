package com.example.be_restaurant.service;

import org.bouncycastle.asn1.x500.X500Name;
import org.bouncycastle.cert.X509CertificateHolder;
import org.bouncycastle.cert.jcajce.JcaX509CertificateConverter;
import org.bouncycastle.cert.jcajce.JcaX509v3CertificateBuilder;
import org.bouncycastle.jce.provider.BouncyCastleProvider;
import org.bouncycastle.operator.ContentSigner;
import org.bouncycastle.operator.jcajce.JcaContentSignerBuilder;
import org.springframework.stereotype.Service;

import java.math.BigInteger;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.security.KeyFactory;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.PrivateKey;
import java.security.PublicKey;
import java.security.Security;
import java.security.Signature;
import java.security.interfaces.RSAPrivateCrtKey;
import java.security.spec.PKCS8EncodedKeySpec;
import java.security.spec.RSAPublicKeySpec;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Base64;
import java.util.Date;

@Service
public class QzSigningService {

    private static final String KEY_DIR = ".restopos/qz";
    private static final String PRIVATE_KEY_FILE = "private_key_pkcs8.pem";
    private static final String CERT_FILE = "certificate.pem";

    private final KeyPair keyPair;
    private final String certificatePem;

    public QzSigningService() {
        ensureBcProvider();
        try {
            KeyMaterial material = loadOrCreateKeyMaterial();
            this.keyPair = material.keyPair();
            this.certificatePem = material.certificatePem();
        } catch (Exception e) {
            throw new IllegalStateException("Không thể khởi tạo QZ signing material", e);
        }
    }

    public String getCertificatePem() {
        return certificatePem;
    }

    /**
     * Ký payload theo chuẩn QZ Tray: SHA256withRSA + base64.
     */
    public String sign(String payload) {
        try {
            Signature signature = Signature.getInstance("SHA256withRSA");
            signature.initSign(keyPair.getPrivate());
            signature.update(payload.getBytes(StandardCharsets.UTF_8));
            byte[] sigBytes = signature.sign();
            return Base64.getEncoder().encodeToString(sigBytes);
        } catch (Exception e) {
            throw new IllegalStateException("Không ký được payload", e);
        }
    }

    private static void ensureBcProvider() {
        if (Security.getProvider(BouncyCastleProvider.PROVIDER_NAME) == null) {
            Security.addProvider(new BouncyCastleProvider());
        }
    }

    private record KeyMaterial(KeyPair keyPair, String certificatePem) {}

    private static KeyMaterial loadOrCreateKeyMaterial() throws Exception {
        Path dir = Paths.get(System.getProperty("user.home")).resolve(KEY_DIR);
        Path privateKeyPath = dir.resolve(PRIVATE_KEY_FILE);
        Path certPath = dir.resolve(CERT_FILE);

        if (Files.exists(privateKeyPath) && Files.exists(certPath)) {
            PrivateKey privateKey = readPrivateKeyPkcs8Pem(privateKeyPath);
            PublicKey publicKey = derivePublicKey(privateKey);
            KeyPair kp = new KeyPair(publicKey, privateKey);
            String certPem = Files.readString(certPath, StandardCharsets.UTF_8);
            return new KeyMaterial(kp, certPem);
        }

        Files.createDirectories(dir);

        KeyPairGenerator kpg = KeyPairGenerator.getInstance("RSA");
        kpg.initialize(2048);
        KeyPair kp = kpg.generateKeyPair();

        String privatePem = toPkcs8PrivateKeyPem(kp.getPrivate().getEncoded());
        Files.writeString(privateKeyPath, privatePem, StandardCharsets.UTF_8);

        String certPem = generateSelfSignedCertificatePem(kp);
        Files.writeString(certPath, certPem, StandardCharsets.UTF_8);

        return new KeyMaterial(kp, certPem);
    }

    private static PrivateKey readPrivateKeyPkcs8Pem(Path path) throws Exception {
        String pem = Files.readString(path, StandardCharsets.UTF_8);
        String base64 = pem
                .replace("-----BEGIN PRIVATE KEY-----", "")
                .replace("-----END PRIVATE KEY-----", "")
                .replaceAll("\\s", "");
        byte[] der = Base64.getDecoder().decode(base64);
        PKCS8EncodedKeySpec spec = new PKCS8EncodedKeySpec(der);
        return KeyFactory.getInstance("RSA").generatePrivate(spec);
    }

    private static PublicKey derivePublicKey(PrivateKey privateKey) throws Exception {
        if (!(privateKey instanceof RSAPrivateCrtKey rsa)) {
            throw new IllegalStateException("Private key không phải RSA CRT");
        }
        RSAPublicKeySpec pubSpec = new RSAPublicKeySpec(rsa.getModulus(), rsa.getPublicExponent());
        return KeyFactory.getInstance("RSA").generatePublic(pubSpec);
    }

    private static String toPkcs8PrivateKeyPem(byte[] pkcs8Der) {
        return "-----BEGIN PRIVATE KEY-----\n" +
                Base64.getMimeEncoder(64, new byte[]{'\n'}).encodeToString(pkcs8Der) +
                "\n-----END PRIVATE KEY-----\n";
    }

    private static String generateSelfSignedCertificatePem(KeyPair keyPair) throws Exception {
        X500Name subject = new X500Name("CN=RestoPOS QZ Signing,O=RestoPOS,L=HCMC,ST=HCMC,C=VN");
        BigInteger serial = BigInteger.valueOf(Instant.now().toEpochMilli());
        Date notBefore = new Date();
        Date notAfter = Date.from(Instant.now().plus(3650, ChronoUnit.DAYS)); // ~10 years

        JcaX509v3CertificateBuilder certBuilder = new JcaX509v3CertificateBuilder(
                subject,
                serial,
                notBefore,
                notAfter,
                subject,
                keyPair.getPublic()
        );

        ContentSigner signer = new JcaContentSignerBuilder("SHA256withRSA")
                .setProvider(BouncyCastleProvider.PROVIDER_NAME)
                .build(keyPair.getPrivate());

        X509CertificateHolder holder = certBuilder.build(signer);
        var cert = new JcaX509CertificateConverter()
                .setProvider(BouncyCastleProvider.PROVIDER_NAME)
                .getCertificate(holder);

        byte[] der = cert.getEncoded();
        return "-----BEGIN CERTIFICATE-----\n" +
                Base64.getMimeEncoder(64, new byte[]{'\n'}).encodeToString(der) +
                "\n-----END CERTIFICATE-----\n";
    }
}


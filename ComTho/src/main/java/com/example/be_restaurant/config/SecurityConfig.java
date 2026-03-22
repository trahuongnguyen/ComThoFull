package com.example.be_restaurant.config;

import com.example.be_restaurant.handle.CustomAccessDeniedHandler;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationEntryPoint jwtAuthenticationEntryPoint;
    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final CustomAccessDeniedHandler customAccessDeniedHandler;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint(jwtAuthenticationEntryPoint)
                        .accessDeniedHandler(customAccessDeniedHandler))
                .sessionManagement(session -> session
                        .sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        // Health check and root
                        .requestMatchers("/health", "/").permitAll()
                        // Static resources
                        .requestMatchers(
                                "/index.html",
                                "/favicon.ico",
                                "/assets/**",
                                "/fonts/**",
                                "/robots.txt",
                                "/placeholder.svg").permitAll()
                        .requestMatchers("/error").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/auth/login").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/auth/profile").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/auth").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.POST, "/api/auth").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/auth/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/auth/**").hasRole("ADMIN")
                        // bill
                        .requestMatchers(HttpMethod.POST, "/api/bill/**").permitAll()
                        // category
                        .requestMatchers(HttpMethod.GET, "/api/categories/**").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/categories").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/categories/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/categories/**").hasRole("ADMIN")
                        // desk
                        .requestMatchers(HttpMethod.GET, "/api/desks/**").permitAll()
                        .requestMatchers(HttpMethod.PUT, "/api/desks/status/**").permitAll()
                        .requestMatchers("/api/desks/**").hasRole("ADMIN")
                        // floor
                        .requestMatchers(HttpMethod.GET, "/api/floors/**").permitAll()
                        .requestMatchers("/api/floors/**").hasRole("ADMIN")
                        // food
                        .requestMatchers(HttpMethod.GET, "/api/foods/**").permitAll()
                        .requestMatchers("/api/foods/**").hasRole("ADMIN")
                        // ordertemp
                        .requestMatchers("/api/orderTemp/**").permitAll()
                        // shift
                        .requestMatchers(HttpMethod.GET, "/api/shift").hasAnyRole("ADMIN")
                        .requestMatchers(HttpMethod.GET, "/api/shift/*/detail").hasAnyRole("ADMIN")
                        .requestMatchers("/api/shift/**").permitAll()
                        // topping
                        .requestMatchers(HttpMethod.GET, "/api/toppings/**").permitAll()
                        .requestMatchers("/api/toppings/**").hasRole("ADMIN")
                        .anyRequest().authenticated());
        http.addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }


    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authenticationConfiguration) throws Exception {
        return authenticationConfiguration.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

}
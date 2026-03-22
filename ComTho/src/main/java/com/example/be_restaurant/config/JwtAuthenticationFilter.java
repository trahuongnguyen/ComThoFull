package com.example.be_restaurant.config;

import com.example.be_restaurant.handle.CustomAccessDeniedHandler;
import com.example.be_restaurant.util.JwtUtil;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
@RequiredArgsConstructor
@Slf4j
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final CustomUserDetailsService userDetailsService;
    private final JwtUtil jwtUtil;
    private final CustomAccessDeniedHandler accessDeniedHandler;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain) throws ServletException, IOException {
        final String authHeader = request.getHeader("Authorization");
        String token = null;
        String username = null;
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            token = authHeader.substring(7);
        }

        log.debug("JwtAuthenticationFilter start - path={}, hasAuthHeader={}", request.getRequestURI(), authHeader != null);

        try {
            if (StringUtils.hasText(token)) {
                log.debug("Found Bearer token, validating");
                boolean valid = false;
                try {
                    valid = jwtUtil.validateToken(token);
                } catch (Exception ex) {
                    // jwtUtil may throw on expired/invalid token; treat as authentication failure but don't commit response here
                    log.warn("JWT validation error: {}", ex.getMessage());
                }
                if (valid) {
                    username = jwtUtil.getUsernameFromJwtToken(token);
                    log.debug("Token validated, username={}", username);
                }
            }

            if (StringUtils.hasText(username) && SecurityContextHolder.getContext().getAuthentication() == null) {
                UserDetails userDetails = userDetailsService.loadUserByUsername(username);
                UsernamePasswordAuthenticationToken authenticationToken = new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
                authenticationToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(authenticationToken);
                log.debug("Authentication set in SecurityContext for user={}", username);
            }
        }
        catch (AccessDeniedException e){
            // Access denied should be handled immediately and return 403
            log.warn("AccessDenied in JwtAuthenticationFilter: {}", e.getMessage());
            accessDeniedHandler.handle(request, response, new AccessDeniedException(e.getLocalizedMessage(), e));
            return; // response handled
        }
        catch (AuthenticationException e){
            // Do NOT call the entry point here - that would commit a 401 response and prevent controller/service exceptions
            log.warn("AuthenticationException in JwtAuthenticationFilter (will not commit response here): {}", e.getMessage());
            // allow filter chain to continue; if endpoint requires auth, Spring Security will later trigger entry point
        }
        catch (Exception e) {
            log.error("Unexpected error in JwtAuthenticationFilter: {}", e.getMessage());
            // continue processing - do not interrupt request flow
        }
        filterChain.doFilter(request, response);
    }
}
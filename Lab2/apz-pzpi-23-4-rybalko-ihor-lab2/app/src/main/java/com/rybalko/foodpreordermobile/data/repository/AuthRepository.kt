package com.rybalko.foodpreordermobile.data.repository

import com.rybalko.foodpreordermobile.data.api.RetrofitClient
import com.rybalko.foodpreordermobile.data.model.*
import retrofit2.Response

class AuthRepository {
    private val authService = RetrofitClient.authService

    suspend fun login(loginDto: LoginDto): Response<AuthResponseDto> {
        return authService.login(loginDto)
    }

    suspend fun register(registerUserDto: RegisterUserDto): Response<String> {
        return authService.register(registerUserDto)
    }

    suspend fun getProfile(token: String): Response<UserProfileDto> {
        return authService.getMe("Bearer $token")
    }

    suspend fun forgotPassword(email: String): Response<Any> {
        return authService.forgotPassword(ForgotPasswordDto(email))
    }
}

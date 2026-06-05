package com.rybalko.foodpreordermobile.data.api

import com.rybalko.foodpreordermobile.data.model.*
import retrofit2.Response
import retrofit2.http.*

interface AuthApiService {
    @POST("api/Auth/register")
    suspend fun register(@Body request: RegisterUserDto): Response<String>

    @POST("api/Auth/login")
    suspend fun login(@Body request: LoginDto): Response<AuthResponseDto>

    @POST("api/Auth/forgot-password")
    suspend fun forgotPassword(@Body request: ForgotPasswordDto): Response<Any>

    @POST("api/Auth/reset-password")
    suspend fun resetPassword(@Body request: ResetPasswordDto): Response<String>

    @GET("api/Auth/me")
    suspend fun getMe(@Header("Authorization") token: String): Response<UserProfileDto>
}

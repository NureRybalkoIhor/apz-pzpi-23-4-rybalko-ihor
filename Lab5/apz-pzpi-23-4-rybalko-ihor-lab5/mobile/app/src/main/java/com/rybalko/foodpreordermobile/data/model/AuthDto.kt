package com.rybalko.foodpreordermobile.data.model

import com.google.gson.annotations.SerializedName

data class LoginDto(
    @SerializedName("email") val email: String,
    @SerializedName("password") val password: String
)

data class RegisterUserDto(
    @SerializedName("fullName") val fullName: String,
    @SerializedName("email") val email: String,
    @SerializedName("password") val password: String,
    @SerializedName("phone") val phone: String
)

data class AuthResponseDto(
    @SerializedName("token") val token: String,
    @SerializedName("email") val email: String,
    @SerializedName("fullName") val fullName: String,
    @SerializedName("role") val role: String
)

data class ForgotPasswordDto(
    @SerializedName("email") val email: String
)

data class ResetPasswordDto(
    @SerializedName("token") val token: String,
    @SerializedName("newPassword") val newPassword: String
)

data class UserProfileDto(
    @SerializedName("id") val id: Int,
    @SerializedName("fullName") val fullName: String,
    @SerializedName("email") val email: String,
    @SerializedName("phone") val phone: String,
    @SerializedName("role") val role: String
)

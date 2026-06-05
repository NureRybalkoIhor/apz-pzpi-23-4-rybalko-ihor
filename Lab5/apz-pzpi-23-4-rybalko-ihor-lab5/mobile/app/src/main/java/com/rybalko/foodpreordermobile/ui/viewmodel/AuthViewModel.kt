package com.rybalko.foodpreordermobile.ui.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.rybalko.foodpreordermobile.data.model.AuthResponseDto
import com.rybalko.foodpreordermobile.data.model.LoginDto
import com.rybalko.foodpreordermobile.data.model.RegisterUserDto
import com.rybalko.foodpreordermobile.data.repository.AuthRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch

sealed class AuthState {
    object Idle : AuthState()
    object Loading : AuthState()
    data class Success(val data: AuthResponseDto) : AuthState()
    data class RegisterSuccess(val message: String) : AuthState()
    data class ForgotPasswordSuccess(val message: String) : AuthState()
    data class Error(val message: String) : AuthState()
}

class AuthViewModel : ViewModel() {

    private val repository = AuthRepository()

    private val _authState = MutableStateFlow<AuthState>(AuthState.Idle)
    val authState: StateFlow<AuthState> = _authState

    fun login(email: String, password: String) {
        viewModelScope.launch {
            _authState.value = AuthState.Loading
            try {
                val response = repository.login(LoginDto(email, password))
                if (response.isSuccessful) {
                    val body = response.body()
                    if (body != null) _authState.value = AuthState.Success(body)
                    else _authState.value = AuthState.Error("Порожня відповідь від сервера")
                } else {
                    _authState.value = AuthState.Error(
                        response.errorBody()?.string() ?: "Невірний email або пароль"
                    )
                }
            } catch (e: Exception) {
                _authState.value = AuthState.Error("Помилка з'єднання з сервером")
            }
        }
    }

    fun register(fullName: String, email: String, password: String, phone: String) {
        viewModelScope.launch {
            _authState.value = AuthState.Loading
            try {
                val response = repository.register(RegisterUserDto(fullName, email, password, phone))
                if (response.isSuccessful) {
                    _authState.value = AuthState.RegisterSuccess("Реєстрація успішна! Тепер увійдіть.")
                } else {
                    _authState.value = AuthState.Error(
                        response.errorBody()?.string() ?: "Помилка реєстрації"
                    )
                }
            } catch (e: Exception) {
                _authState.value = AuthState.Error("Помилка з'єднання з сервером")
            }
        }
    }

    fun forgotPassword(email: String) {
        viewModelScope.launch {
            _authState.value = AuthState.Loading
            try {
                val response = repository.forgotPassword(email)
                if (response.isSuccessful) {
                    _authState.value = AuthState.ForgotPasswordSuccess("Інструкції надіслано на email")
                } else {
                    _authState.value = AuthState.Error(
                        response.errorBody()?.string() ?: "Помилка відновлення пароля"
                    )
                }
            } catch (e: Exception) {
                _authState.value = AuthState.Error("Помилка з'єднання з сервером")
            }
        }
    }

    fun resetState() {
        _authState.value = AuthState.Idle
    }
}

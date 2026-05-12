package com.rybalko.foodpreordermobile.ui.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.rybalko.foodpreordermobile.data.model.UserProfileDto
import com.rybalko.foodpreordermobile.data.repository.AuthRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch

sealed class ProfileState {
    object Loading : ProfileState()
    data class Success(val profile: UserProfileDto) : ProfileState()
    data class Error(val message: String) : ProfileState()
}

class ProfileViewModel : ViewModel() {
    private val repository = AuthRepository()

    private val _state = MutableStateFlow<ProfileState>(ProfileState.Loading)
    val state: StateFlow<ProfileState> = _state

    fun loadProfile(token: String) {
        viewModelScope.launch {
            _state.value = ProfileState.Loading
            try {
                val response = repository.getProfile(token)
                if (response.isSuccessful && response.body() != null) {
                    _state.value = ProfileState.Success(response.body()!!)
                } else {
                    _state.value = ProfileState.Error("Не вдалося завантажити профіль: ${response.code()}")
                }
            } catch (e: Exception) {
                _state.value = ProfileState.Error("Помилка з'єднання: ${e.message}")
            }
        }
    }
}

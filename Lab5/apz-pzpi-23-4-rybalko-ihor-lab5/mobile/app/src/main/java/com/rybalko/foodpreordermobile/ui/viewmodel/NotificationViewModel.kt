package com.rybalko.foodpreordermobile.ui.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.rybalko.foodpreordermobile.data.api.NotificationDto
import com.rybalko.foodpreordermobile.data.repository.NotificationRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch

sealed class NotificationState {
    object Loading : NotificationState()
    data class Loaded(val notifications: List<NotificationDto>) : NotificationState()
    data class Error(val message: String) : NotificationState()
}

class NotificationViewModel : ViewModel() {

    private val repository = NotificationRepository()

    private val _state = MutableStateFlow<NotificationState>(NotificationState.Loading)
    val state: StateFlow<NotificationState> = _state

    fun load(token: String) {
        viewModelScope.launch {
            _state.value = NotificationState.Loading
            try {
                val response = repository.getNotifications(token)
                if (response.isSuccessful) {
                    val sorted = (response.body() ?: emptyList())
                        .sortedByDescending { it.dateSent }
                    _state.value = NotificationState.Loaded(sorted)
                } else {
                    _state.value = NotificationState.Error("Не вдалося завантажити сповіщення")
                }
            } catch (e: Exception) {
                _state.value = NotificationState.Error("Помилка з'єднання з сервером")
            }
        }
    }

    fun markAsRead(token: String, id: Int) {
        viewModelScope.launch {
            try {
                repository.markAsRead(token, id)
                val current = _state.value
                if (current is NotificationState.Loaded) {
                    _state.value = NotificationState.Loaded(
                        current.notifications.map {
                            if (it.id == id) it.copy(isRead = true) else it
                        }
                    )
                }
            } catch (_: Exception) {}
        }
    }

    fun markAllAsRead(token: String) {
        viewModelScope.launch {
            val current = _state.value
            if (current is NotificationState.Loaded) {
                current.notifications.filter { !it.isRead }.forEach { n ->
                    try { repository.markAsRead(token, n.id) } catch (_: Exception) {}
                }
                _state.value = NotificationState.Loaded(
                    current.notifications.map { it.copy(isRead = true) }
                )
            }
        }
    }
}

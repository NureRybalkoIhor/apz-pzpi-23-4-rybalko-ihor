package com.rybalko.foodpreordermobile.ui.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.rybalko.foodpreordermobile.data.model.RestaurantDto
import com.rybalko.foodpreordermobile.data.repository.RestaurantRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch

sealed class RestaurantsState {
    object Loading : RestaurantsState()
    data class Success(val restaurants: List<RestaurantDto>) : RestaurantsState()
    data class Error(val message: String) : RestaurantsState()
}

class HomeViewModel : ViewModel() {

    private val repository = RestaurantRepository()

    private val _state = MutableStateFlow<RestaurantsState>(RestaurantsState.Loading)
    val state: StateFlow<RestaurantsState> = _state

    fun loadRestaurants(lat: Double? = null, lon: Double? = null) {
        viewModelScope.launch {
            _state.value = RestaurantsState.Loading
            try {
                val response = repository.getRestaurants(lat, lon)
                if (response.isSuccessful) {
                    _state.value = RestaurantsState.Success(response.body() ?: emptyList())
                } else {
                    _state.value = RestaurantsState.Error("Не вдалося завантажити ресторани")
                }
            } catch (e: Exception) {
                _state.value = RestaurantsState.Error("Помилка з'єднання з сервером")
            }
        }
    }
}

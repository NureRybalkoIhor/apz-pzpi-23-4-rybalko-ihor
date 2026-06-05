package com.rybalko.foodpreordermobile.ui.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.rybalko.foodpreordermobile.data.model.CreateOrderDto
import com.rybalko.foodpreordermobile.data.model.CreateOrderItemDto
import com.rybalko.foodpreordermobile.data.model.OrderDto
import com.rybalko.foodpreordermobile.data.repository.OrderRepository
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import java.time.LocalDateTime
import java.time.format.DateTimeFormatter

sealed class OrderState {
    object Idle : OrderState()
    object Loading : OrderState()
    data class Created(val order: OrderDto) : OrderState()
    data class Tracking(val order: OrderDto) : OrderState()
    data class HistoryLoaded(val orders: List<OrderDto>) : OrderState()
    object PaymentSuccess : OrderState()
    object CancelSuccess : OrderState()
    data class Error(val message: String) : OrderState()
}

class OrderViewModel : ViewModel() {

    private val repository = OrderRepository()

    private val _state = MutableStateFlow<OrderState>(OrderState.Idle)
    val state: StateFlow<OrderState> = _state

    fun createOrder(
        token: String,
        restaurantId: Int,
        items: List<CreateOrderItemDto>,
        visitTime: LocalDateTime,
        comment: String?
    ) {
        viewModelScope.launch {
            _state.value = OrderState.Loading
            try {
                val formatter = DateTimeFormatter.ISO_LOCAL_DATE_TIME
                val dto = CreateOrderDto(
                    restaurantId = restaurantId,
                    visitTime = visitTime.format(formatter),
                    comment = comment,
                    items = items
                )
                val response = repository.createOrder(token, dto)
                if (response.isSuccessful && response.body() != null) {
                    _state.value = OrderState.Created(response.body()!!)
                } else {
                    _state.value = OrderState.Error(
                        response.errorBody()?.string() ?: "Не вдалося створити замовлення"
                    )
                }
            } catch (e: Exception) {
                _state.value = OrderState.Error("Помилка з'єднання з сервером")
            }
        }
    }

    fun trackOrder(token: String, orderId: Int) {
        viewModelScope.launch {
            while (true) {
                try {
                    val response = repository.getOrder(token, orderId)
                    if (response.isSuccessful && response.body() != null) {
                        _state.value = OrderState.Tracking(response.body()!!)
                        val status = response.body()!!.status
                        if (status == "Completed" || status == "Cancelled") break
                    }
                } catch (_: Exception) {}
                delay(10_000)
            }
        }
    }

    fun loadOrderHistory(token: String) {
        viewModelScope.launch {
            _state.value = OrderState.Loading
            try {
                val response = repository.getOrders(token)
                if (response.isSuccessful) {
                    _state.value = OrderState.HistoryLoaded(response.body() ?: emptyList())
                } else {
                    _state.value = OrderState.Error("Не вдалося завантажити замовлення")
                }
            } catch (e: Exception) {
                _state.value = OrderState.Error("Помилка з'єднання з сервером")
            }
        }
    }

    fun payOrder(token: String, orderId: Int) {
        viewModelScope.launch {
            _state.value = OrderState.Loading
            try {
                val response = repository.payOrder(token, orderId)
                if (response.isSuccessful) {
                    _state.value = OrderState.PaymentSuccess
                } else {
                    _state.value = OrderState.Error(
                        response.errorBody()?.string() ?: "Не вдалося здійснити оплату"
                    )
                }
            } catch (e: Exception) {
                _state.value = OrderState.Error("Помилка з'єднання з сервером")
            }
        }
    }

    fun cancelOrder(token: String, orderId: Int) {
        viewModelScope.launch {
            _state.value = OrderState.Loading
            try {
                val response = repository.cancelOrder(token, orderId)
                if (response.isSuccessful) {
                    _state.value = OrderState.CancelSuccess
                } else {
                    _state.value = OrderState.Error(
                        response.errorBody()?.string() ?: "Не вдалося скасувати замовлення"
                    )
                }
            } catch (e: Exception) {
                _state.value = OrderState.Error("Помилка з'єднання з сервером")
            }
        }
    }

    fun resetState() { _state.value = OrderState.Idle }
}

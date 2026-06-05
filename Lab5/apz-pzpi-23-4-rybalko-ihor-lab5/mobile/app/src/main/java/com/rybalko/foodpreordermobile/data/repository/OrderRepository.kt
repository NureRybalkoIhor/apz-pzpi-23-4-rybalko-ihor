package com.rybalko.foodpreordermobile.data.repository

import com.rybalko.foodpreordermobile.data.api.RetrofitClient
import com.rybalko.foodpreordermobile.data.model.CreateOrderDto
import com.rybalko.foodpreordermobile.data.model.OrderDto
import retrofit2.Response

class OrderRepository {
    private val orderService = RetrofitClient.orderService

    suspend fun getOrders(token: String): Response<List<OrderDto>> {
        return orderService.getOrders("Bearer $token")
    }

    suspend fun getOrder(token: String, id: Int): Response<OrderDto> {
        return orderService.getOrder("Bearer $token", id)
    }

    suspend fun createOrder(token: String, createOrderDto: CreateOrderDto): Response<OrderDto> {
        return orderService.createOrder("Bearer $token", createOrderDto)
    }

    suspend fun payOrder(token: String, id: Int): Response<Any> {
        return orderService.payOrder("Bearer $token", id)
    }

    suspend fun cancelOrder(token: String, id: Int): Response<Any> {
        return orderService.cancelOrder("Bearer $token", id)
    }
}

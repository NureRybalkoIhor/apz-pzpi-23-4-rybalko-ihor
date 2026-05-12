package com.rybalko.foodpreordermobile.data.api

import com.rybalko.foodpreordermobile.data.model.CreateOrderDto
import com.rybalko.foodpreordermobile.data.model.OrderDto
import retrofit2.Response
import retrofit2.http.*

interface OrderApiService {
    @GET("api/Orders")
    suspend fun getOrders(@Header("Authorization") token: String): Response<List<OrderDto>>

    @GET("api/Orders/{id}")
    suspend fun getOrder(
        @Header("Authorization") token: String,
        @Path("id") id: Int
    ): Response<OrderDto>

    @POST("api/Orders")
    suspend fun createOrder(
        @Header("Authorization") token: String,
        @Body createOrderDto: CreateOrderDto
    ): Response<OrderDto>

    @POST("api/Orders/{id}/pay")
    suspend fun payOrder(
        @Header("Authorization") token: String,
        @Path("id") id: Int
    ): Response<Any>

    @POST("api/Orders/{id}/cancel")
    suspend fun cancelOrder(
        @Header("Authorization") token: String,
        @Path("id") id: Int
    ): Response<Any>
}

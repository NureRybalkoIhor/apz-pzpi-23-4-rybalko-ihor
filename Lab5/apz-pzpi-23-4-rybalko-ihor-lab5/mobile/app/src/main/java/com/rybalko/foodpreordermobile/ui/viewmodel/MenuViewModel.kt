package com.rybalko.foodpreordermobile.ui.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.rybalko.foodpreordermobile.data.model.CartItem
import com.rybalko.foodpreordermobile.data.model.DishDto
import com.rybalko.foodpreordermobile.data.repository.DishRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch

sealed class MenuState {
    object Loading : MenuState()
    data class Success(
        val dishes: List<DishDto>,
        val categories: List<com.rybalko.foodpreordermobile.data.model.CategoryDto> = emptyList()
    ) : MenuState()
    data class Error(val message: String) : MenuState()
}

class MenuViewModel : ViewModel() {

    private val repository = DishRepository()

    private val _menuState = MutableStateFlow<MenuState>(MenuState.Loading)
    val menuState: StateFlow<MenuState> = _menuState

    private val _cart = MutableStateFlow<List<CartItem>>(emptyList())
    val cart: StateFlow<List<CartItem>> = _cart

    val cartCount: Int get() = _cart.value.sumOf { it.quantity }
    val cartTotal: Double get() = _cart.value.sumOf { it.totalPrice }

    private val _selectedCategoryId = MutableStateFlow<Int?>(null)
    val selectedCategoryId: StateFlow<Int?> = _selectedCategoryId

    fun selectCategory(categoryId: Int?) {
        _selectedCategoryId.value = categoryId
    }

    fun loadMenu(token: String, restaurantId: Int) {
        viewModelScope.launch {
            _menuState.value = MenuState.Loading
            try {
                val categoriesResponse = repository.getCategories(token, restaurantId)
                val dishesResponse = repository.getDishes(token, null) 

                if (categoriesResponse.isSuccessful && dishesResponse.isSuccessful) {
                    val allDishes = dishesResponse.body() ?: emptyList()
                    val restaurantDishes = allDishes.filter { it.categoryId in (categoriesResponse.body()?.map { c -> c.id } ?: emptyList()) }
                    
                    _menuState.value = MenuState.Success(
                        dishes = restaurantDishes,
                        categories = categoriesResponse.body() ?: emptyList()
                    )
                } else {
                    _menuState.value = MenuState.Error("Не вдалося завантажити меню")
                }
            } catch (e: Exception) {
                _menuState.value = MenuState.Error("Помилка з'єднання з сервером")
            }
        }
    }

    fun addToCart(dish: DishDto) {
        val currentCart = _cart.value
        val existing = currentCart.find { it.dishId == dish.id }
        _cart.value = if (existing != null) {
            currentCart.map { if (it.dishId == dish.id) it.copy(quantity = it.quantity + 1) else it }
        } else {
            currentCart + CartItem(dish.id, dish.nameUA, dish.nameEN, dish.price, dish.imageUrl, dish.preparationTimeMinutes)
        }
    }

    fun removeFromCart(dishId: Int) {
        val currentCart = _cart.value
        val existing = currentCart.find { it.dishId == dishId } ?: return
        _cart.value = if (existing.quantity > 1) {
            currentCart.map { if (it.dishId == dishId) it.copy(quantity = it.quantity - 1) else it }
        } else {
            currentCart.filter { it.dishId != dishId }
        }
    }

    fun clearCart() {
        _cart.value = emptyList()
    }
}

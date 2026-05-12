package com.rybalko.foodpreordermobile.validation

import com.rybalko.foodpreordermobile.data.model.CartItem
import java.time.LocalDateTime

/**
 * Центральний модуль бізнес-валідації.
 * Усі правила перевірки зосереджені тут — екрани лише викликають ці функції.
 * Sealed class Result<T> = Success | Error(reason)
 */
sealed class ValidationResult {
    object Ok : ValidationResult()
    data class Fail(val message: String) : ValidationResult()

    val isOk get() = this is Ok
    val errorMessage get() = (this as? Fail)?.message
}

object AuthValidator {

    private val EMAIL_REGEX = Regex("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$")
    private val PHONE_REGEX = Regex("^\\+?[0-9]{10,15}$")

    fun validateLoginCredential(value: String): ValidationResult = when {
        value.isBlank()                                   -> ValidationResult.Fail("Введіть email або номер телефону")
        value.contains("@") && !EMAIL_REGEX.matches(value)-> ValidationResult.Fail("Невірний формат email")
        !value.contains("@") && !PHONE_REGEX.matches(value.replace("\\s".toRegex(), ""))
                                                          -> ValidationResult.Fail("Невірний формат телефону (10-15 цифр)")
        else                                              -> ValidationResult.Ok
    }

    fun validatePassword(password: String): ValidationResult = when {
        password.isBlank()    -> ValidationResult.Fail("Введіть пароль")
        password.length < 6   -> ValidationResult.Fail("Пароль мінімум 6 символів")
        else                  -> ValidationResult.Ok
    }

    fun validateFullName(name: String): ValidationResult = when {
        name.isBlank()        -> ValidationResult.Fail("Введіть своє повне ім'я")
        name.trim().length < 2-> ValidationResult.Fail("Ім'я занадто коротке")
        name.any { it.isDigit() } -> ValidationResult.Fail("Ім'я не може містити цифри")
        else                  -> ValidationResult.Ok
    }

    fun validateEmail(email: String): ValidationResult = when {
        email.isBlank()              -> ValidationResult.Fail("Введіть email")
        !EMAIL_REGEX.matches(email)  -> ValidationResult.Fail("Невірний формат email")
        else                         -> ValidationResult.Ok
    }

    fun validatePhone(phone: String): ValidationResult = when {
        phone.isBlank()              -> ValidationResult.Fail("Введіть номер телефону")
        !PHONE_REGEX.matches(phone.replace("\\s".toRegex(), "")) ->
            ValidationResult.Fail("Формат: +380XXXXXXXXX (10-15 цифр)")
        else                         -> ValidationResult.Ok
    }

    fun validatePasswordConfirm(password: String, confirm: String): ValidationResult = when {
        confirm.isBlank()        -> ValidationResult.Fail("Підтвердіть пароль")
        confirm != password      -> ValidationResult.Fail("Паролі не співпадають")
        else                     -> ValidationResult.Ok
    }

    fun validateRegistration(
        fullName: String, email: String, phone: String,
        password: String, confirm: String
    ): ValidationResult {
        return listOf(
            validateFullName(fullName),
            validateEmail(email),
            validatePhone(phone),
            validatePassword(password),
            validatePasswordConfirm(password, confirm)
        ).firstOrNull { it is ValidationResult.Fail } ?: ValidationResult.Ok
    }
}

object CartValidator {

    private const val MAX_QUANTITY_PER_DISH = 20
    private const val MAX_CART_ITEMS = 30
    private const val MIN_ORDER_AMOUNT = 30.0 // ₴

    fun validateCartNotEmpty(cart: List<CartItem>): ValidationResult =
        if (cart.isEmpty()) ValidationResult.Fail("Кошик порожній. Додайте хоча б одну страву")
        else ValidationResult.Ok

    fun validateCartSize(cart: List<CartItem>): ValidationResult =
        if (cart.sumOf { it.quantity } > MAX_CART_ITEMS)
            ValidationResult.Fail("Максимум $MAX_CART_ITEMS позицій в одному замовленні")
        else ValidationResult.Ok

    fun validateMinAmount(cart: List<CartItem>): ValidationResult {
        val total = cart.sumOf { it.totalPrice }
        return if (total < MIN_ORDER_AMOUNT)
            ValidationResult.Fail("Мінімальна сума замовлення — ${MIN_ORDER_AMOUNT.toInt()} ₴")
        else ValidationResult.Ok
    }

    fun validateQuantityAdd(currentQty: Int): ValidationResult =
        if (currentQty >= MAX_QUANTITY_PER_DISH)
            ValidationResult.Fail("Максимум $MAX_QUANTITY_PER_DISH одиниць однієї страви")
        else ValidationResult.Ok

    fun validateRestaurantConsistency(restaurantId: Int): ValidationResult =
        if (restaurantId <= 0)
            ValidationResult.Fail("Не вдалося визначити ресторан. Поверніться і оберіть заново")
        else ValidationResult.Ok

    /** Повна перевірка кошика перед відправкою замовлення */
    fun validateBeforeOrder(cart: List<CartItem>, restaurantId: Int): ValidationResult =
        listOf(
            validateCartNotEmpty(cart),
            validateCartSize(cart),
            validateMinAmount(cart),
            validateRestaurantConsistency(restaurantId)
        ).firstOrNull { it is ValidationResult.Fail } ?: ValidationResult.Ok
}

object OrderTimeValidator {

    const val MAX_DAYS_AHEAD = 3L
    const val MIN_BUFFER_MINUTES = 15L

    fun calcMinVisitTime(cart: List<CartItem>): LocalDateTime {
        val maxPrep = cart.maxOfOrNull { it.preparationTimeMinutes }?.toLong() ?: MIN_BUFFER_MINUTES
        return LocalDateTime.now().plusMinutes(maxOf(maxPrep, MIN_BUFFER_MINUTES))
    }

    fun calcMaxVisitTime(): LocalDateTime = LocalDateTime.now().plusDays(MAX_DAYS_AHEAD)

    fun validate(visitTime: LocalDateTime?, cart: List<CartItem>): ValidationResult {
        if (visitTime == null) return ValidationResult.Fail("Оберіть час візиту")

        val minTime = calcMinVisitTime(cart)
        val maxTime = calcMaxVisitTime()

        if (visitTime.isBefore(LocalDateTime.now()))
            return ValidationResult.Fail("Не можна замовляти в минулому")

        if (visitTime.isBefore(minTime)) {
            val maxPrep = cart.maxOfOrNull { it.preparationTimeMinutes } ?: MIN_BUFFER_MINUTES.toInt()
            val slowest = cart.maxByOrNull { it.preparationTimeMinutes }?.nameUA ?: ""
            return ValidationResult.Fail(
                "Занадто рано! «$slowest» готується $maxPrep хв — " +
                "найраніший можливий час: ${minTime.toLocalTime().toString().take(5)}"
            )
        }

        if (visitTime.isAfter(maxTime))
            return ValidationResult.Fail("Не можна замовляти більше ніж на $MAX_DAYS_AHEAD дні вперед")

        return ValidationResult.Ok
    }
}

object PaymentValidator {

    private val EXPIRY_REGEX = Regex("^(0[1-9]|1[0-2])/([0-9]{2})$")

    fun validateCardNumber(number: String): ValidationResult = when {
        number.isBlank()     -> ValidationResult.Fail("Введіть номер картки")
        number.length != 16  -> ValidationResult.Fail("Номер картки має містити 16 цифр")
        !number.all { it.isDigit() } -> ValidationResult.Fail("Номер картки має містити лише цифри")
        !luhnCheck(number)   -> ValidationResult.Fail("Невірний номер картки (перевірка Luhn)")
        else                 -> ValidationResult.Ok
    }

    fun validateExpiry(expiry: String): ValidationResult {
        if (!EXPIRY_REGEX.matches(expiry)) return ValidationResult.Fail("Формат: ММ/РР")
        val (month, year) = expiry.split("/")
        val now = java.time.LocalDate.now()
        val cardYear = 2000 + year.toInt()
        val cardMonth = month.toInt()
        return when {
            cardYear < now.year -> ValidationResult.Fail("Картка прострочена")
            cardYear == now.year && cardMonth < now.monthValue -> ValidationResult.Fail("Картка прострочена")
            else -> ValidationResult.Ok
        }
    }

    fun validateCvv(cvv: String): ValidationResult = when {
        cvv.isBlank()        -> ValidationResult.Fail("Введіть CVV")
        cvv.length !in 3..4  -> ValidationResult.Fail("CVV має містити 3-4 цифри")
        !cvv.all { it.isDigit() } -> ValidationResult.Fail("CVV має містити лише цифри")
        else                 -> ValidationResult.Ok
    }

    /** Алгоритм Луна для перевірки номера картки */
    fun luhnCheck(number: String): Boolean {
        var sum = 0
        var alternate = false
        for (i in number.length - 1 downTo 0) {
            var n = number[i].digitToInt()
            if (alternate) {
                n *= 2
                if (n > 9) n -= 9
            }
            sum += n
            alternate = !alternate
        }
        return sum % 10 == 0
    }

    fun validateAll(cardNumber: String, expiry: String, cvv: String): ValidationResult =
        listOf(
            validateCardNumber(cardNumber),
            validateExpiry(expiry),
            validateCvv(cvv)
        ).firstOrNull { it is ValidationResult.Fail } ?: ValidationResult.Ok
}

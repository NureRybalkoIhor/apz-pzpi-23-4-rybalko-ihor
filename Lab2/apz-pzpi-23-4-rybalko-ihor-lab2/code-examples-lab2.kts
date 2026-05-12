// В.1 Програмний код довідки щодо генерації кодової реалізації підсистеми за допомогою ШІ (див. пункт 3.6.1)
//Результат (приклад програмного коду):
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

//В.2 Програмний код довідки щодо генерації логіки динамічного розрахунку часу візиту за допомогою ШІ (див. пункт 3.6.2)
//Результат (приклад програмного коду):
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

//В.3 Програмний код довідки щодо генерації механізму відстеження замовлення в реальному часі за допомогою ШІ (див. пункт 3.6.3)
//Результат (приклад програмного коду):
   fun trackOrder(token: String, orderId: Int) {
           viewModelScope.launch {
               while (true) {
                   try {
                       val response = repository.getOrder(token, orderId)
                       if (response.isSuccessful && response.body() != null) {
                           _state.value = OrderState.Tracking(response.body()!!)
                           // Зупиняємо поллінг якщо замовлення завершено або скасовано
                           val status = response.body()!!.status
                          if (status == "Completed" || status == "Cancelled") break
                      }
                  } catch (_: Exception) {}
                  delay(10_000) // Оновлювати кожні 10 секунд
              }
          }
      }

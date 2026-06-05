package com.rybalko.foodpreordermobile.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.rybalko.foodpreordermobile.ui.viewmodel.AuthState
import com.rybalko.foodpreordermobile.ui.viewmodel.AuthViewModel
import com.rybalko.foodpreordermobile.validation.AuthValidator

private val DarkBg2 = Color(0xFF1A1A2E)
private val CardBg2 = Color(0xFF16213E)
private val Accent2 = Color(0xFFE94560)
private val InputBg2 = Color(0xFF0F3460)
private val TextSecondary2 = Color(0xFF8892B0)

@Composable
fun RegisterScreen(
    onRegisterSuccess: () -> Unit,
    onNavigateToLogin: () -> Unit,
    viewModel: AuthViewModel = viewModel()
) {
    var fullName by remember { mutableStateOf("") }
    var email by remember { mutableStateOf("") }
    var phone by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var confirmPassword by remember { mutableStateOf("") }
    var passwordVisible by remember { mutableStateOf(false) }
    var fullNameError by remember { mutableStateOf<String?>(null) }
    var emailError by remember { mutableStateOf<String?>(null) }
    var phoneError by remember { mutableStateOf<String?>(null) }
    var passwordError by remember { mutableStateOf<String?>(null) }
    var confirmError by remember { mutableStateOf<String?>(null) }
    var errorMessage by remember { mutableStateOf<String?>(null) }

    val authState by viewModel.authState.collectAsState()

    LaunchedEffect(authState) {
        when (authState) {
            is AuthState.RegisterSuccess -> {
                errorMessage = null
                onRegisterSuccess()
                viewModel.resetState()
            }
            is AuthState.Error -> {
                errorMessage = (authState as AuthState.Error).message
            }
            else -> {}
        }
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Brush.verticalGradient(listOf(DarkBg2, Color(0xFF0F3460))))
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Spacer(Modifier.height(48.dp))

            Text("🍽️", fontSize = 48.sp)
            Spacer(Modifier.height(6.dp))
            Text("Реєстрація", fontSize = 26.sp, fontWeight = FontWeight.Bold, color = Accent2)
            Text("Створіть ваш акаунт", fontSize = 13.sp, color = TextSecondary2)

            Spacer(Modifier.height(32.dp))

            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(24.dp))
                    .background(CardBg2)
                    .padding(24.dp)
            ) {
                Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {

                    val textFieldColors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = Accent2,
                        unfocusedBorderColor = InputBg2,
                        focusedTextColor = Color.White,
                        unfocusedTextColor = Color.White,
                        cursorColor = Accent2
                    )

                    OutlinedTextField(
                        value = fullName,
                        onValueChange = { fullName = it; fullNameError = null },
                        label = { Text("Повне ім'я", color = TextSecondary2) },
                        leadingIcon = { Icon(Icons.Default.Person, null, tint = Accent2) },
                        isError = fullNameError != null,
                        supportingText = fullNameError?.let { { Text(it, color = MaterialTheme.colorScheme.error) } },
                        modifier = Modifier.fillMaxWidth(),
                        colors = textFieldColors,
                        shape = RoundedCornerShape(12.dp)
                    )

                    OutlinedTextField(
                        value = email,
                        onValueChange = { email = it; emailError = null },
                        label = { Text("Email", color = TextSecondary2) },
                        leadingIcon = { Icon(Icons.Default.Email, null, tint = Accent2) },
                        isError = emailError != null,
                        supportingText = emailError?.let { { Text(it, color = MaterialTheme.colorScheme.error) } },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email),
                        modifier = Modifier.fillMaxWidth(),
                        colors = textFieldColors,
                        shape = RoundedCornerShape(12.dp)
                    )

                    OutlinedTextField(
                        value = phone,
                        onValueChange = { phone = it; phoneError = null },
                        label = { Text("Номер телефону (+380...)", color = TextSecondary2) },
                        leadingIcon = { Icon(Icons.Default.Phone, null, tint = Accent2) },
                        isError = phoneError != null,
                        supportingText = phoneError?.let { { Text(it, color = MaterialTheme.colorScheme.error) } },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Phone),
                        modifier = Modifier.fillMaxWidth(),
                        colors = textFieldColors,
                        shape = RoundedCornerShape(12.dp)
                    )

                    OutlinedTextField(
                        value = password,
                        onValueChange = { password = it; passwordError = null },
                        label = { Text("Пароль", color = TextSecondary2) },
                        leadingIcon = { Icon(Icons.Default.Lock, null, tint = Accent2) },
                        trailingIcon = {
                            IconButton(onClick = { passwordVisible = !passwordVisible }) {
                                Icon(
                                    if (passwordVisible) Icons.Default.Visibility else Icons.Default.VisibilityOff,
                                    null, tint = TextSecondary2
                                )
                            }
                        },
                        isError = passwordError != null,
                        supportingText = passwordError?.let { { Text(it, color = MaterialTheme.colorScheme.error) } },
                        visualTransformation = if (passwordVisible) VisualTransformation.None else PasswordVisualTransformation(),
                        modifier = Modifier.fillMaxWidth(),
                        colors = textFieldColors,
                        shape = RoundedCornerShape(12.dp)
                    )

                    OutlinedTextField(
                        value = confirmPassword,
                        onValueChange = { confirmPassword = it; confirmError = null },
                        label = { Text("Підтвердіть пароль", color = TextSecondary2) },
                        leadingIcon = { Icon(Icons.Default.Lock, null, tint = Accent2) },
                        visualTransformation = PasswordVisualTransformation(),
                        isError = confirmError != null,
                        supportingText = confirmError?.let { { Text(it, color = MaterialTheme.colorScheme.error) } },
                        modifier = Modifier.fillMaxWidth(),
                        colors = textFieldColors,
                        shape = RoundedCornerShape(12.dp)
                    )

                    if (password.isNotEmpty()) {
                        val strength = when {
                            password.length < 6 -> 0
                            password.length < 8 || !password.any { it.isDigit() } -> 1
                            password.length >= 10 && password.any { it.isDigit() } && password.any { it.isUpperCase() } -> 3
                            else -> 2
                        }
                        val (label, color) = when (strength) {
                            0 -> "Слабкий" to Color(0xFFFF5252)
                            1 -> "Середній" to Color(0xFFFFB300)
                            2 -> "Хороший" to Color(0xFF4CAF50)
                            else -> "Міцний" to Color(0xFF00E676)
                        }
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            LinearProgressIndicator(
                                progress = { (strength + 1) / 4f },
                                modifier = Modifier.weight(1f).height(4.dp).clip(RoundedCornerShape(2.dp)),
                                color = color,
                                trackColor = Color(0xFF0F3460)
                            )
                            Spacer(Modifier.width(8.dp))
                            Text(label, color = color, fontSize = 11.sp)
                        }
                    }



                    Spacer(Modifier.height(8.dp))

                    if (errorMessage != null) {
                        Text(
                            errorMessage!!,
                            color = Color(0xFFFF6B6B),
                            fontSize = 13.sp,
                            modifier = Modifier.fillMaxWidth()
                        )
                        Spacer(Modifier.height(8.dp))
                    }

                    Button(
                        onClick = {
                            fullNameError = null; emailError = null; phoneError = null
                            passwordError = null; confirmError = null

                            val fnRes = AuthValidator.validateFullName(fullName)
                            val emRes = AuthValidator.validateEmail(email)
                            val phRes = AuthValidator.validatePhone(phone)
                            val pwRes = AuthValidator.validatePassword(password)
                            val cfRes = AuthValidator.validatePasswordConfirm(password, confirmPassword)

                            fullNameError = fnRes.errorMessage
                            emailError    = emRes.errorMessage
                            phoneError    = phRes.errorMessage
                            passwordError = pwRes.errorMessage
                            confirmError  = cfRes.errorMessage

                            val allOk = listOf(fnRes, emRes, phRes, pwRes, cfRes).all { it.isOk }
                            if (allOk) viewModel.register(fullName.trim(), email.trim(), password, phone.trim())
                        },
                        modifier = Modifier.fillMaxWidth().height(52.dp),
                        shape = RoundedCornerShape(14.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = Accent2),
                        enabled = authState !is AuthState.Loading
                    ) {
                        if (authState is AuthState.Loading) {
                            CircularProgressIndicator(color = Color.White, modifier = Modifier.size(20.dp), strokeWidth = 2.dp)
                        } else {
                            Text("Зареєструватись", fontSize = 16.sp, fontWeight = FontWeight.SemiBold)
                        }
                    }
                }
            }

            Spacer(Modifier.height(24.dp))

            Row(verticalAlignment = Alignment.CenterVertically) {
                Text("Вже маєте акаунт? ", color = TextSecondary2)
                TextButton(onClick = onNavigateToLogin) {
                    Text("Увійти", color = Accent2, fontWeight = FontWeight.Bold)
                }
            }

            Spacer(Modifier.height(24.dp))
        }
    }
}

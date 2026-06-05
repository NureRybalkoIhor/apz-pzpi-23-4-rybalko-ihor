package com.rybalko.foodpreordermobile.data

import android.content.Context
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map

private val Context.dataStore by preferencesDataStore(name = "user_session")

class SessionManager(private val context: Context) {

    companion object {
        private val TOKEN_KEY = stringPreferencesKey("auth_token")
        private val ROLE_KEY = stringPreferencesKey("user_role")
        private val NAME_KEY = stringPreferencesKey("user_name")
        private val EMAIL_KEY = stringPreferencesKey("user_email")
        
        private val CARD_NUMBER_KEY = stringPreferencesKey("saved_card_number")
        private val CARD_EXPIRY_KEY = stringPreferencesKey("saved_card_expiry")
        private val CARD_CVV_KEY = stringPreferencesKey("saved_card_cvv")
    }

    val tokenFlow: Flow<String?> = context.dataStore.data.map { it[TOKEN_KEY] }
    val roleFlow: Flow<String?> = context.dataStore.data.map { it[ROLE_KEY] }
    val nameFlow: Flow<String?> = context.dataStore.data.map { it[NAME_KEY] }
    
    val savedCardNumberFlow: Flow<String?> = context.dataStore.data.map { it[CARD_NUMBER_KEY] }
    val savedCardExpiryFlow: Flow<String?> = context.dataStore.data.map { it[CARD_EXPIRY_KEY] }
    val savedCardCvvFlow: Flow<String?> = context.dataStore.data.map { it[CARD_CVV_KEY] }

    suspend fun saveSession(token: String, role: String, name: String, email: String) {
        context.dataStore.edit { prefs ->
            prefs[TOKEN_KEY] = token
            prefs[ROLE_KEY] = role
            prefs[NAME_KEY] = name
            prefs[EMAIL_KEY] = email
        }
    }

    suspend fun saveCardDetails(number: String, expiry: String, cvv: String) {
        context.dataStore.edit { prefs ->
            prefs[CARD_NUMBER_KEY] = number
            prefs[CARD_EXPIRY_KEY] = expiry
            prefs[CARD_CVV_KEY] = cvv
        }
    }

    suspend fun clearSession() {
        context.dataStore.edit { it.clear() }
    }
}

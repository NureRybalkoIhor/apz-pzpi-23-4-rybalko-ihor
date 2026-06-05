using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FoodPreOrder.Application.DTOs.Auth
{
    public class ResetPasswordDto
    {
        [Required]
        public string Token { get; set; } = string.Empty;

        [Required(ErrorMessage = "Новий пароль є обов'язковим")]
        [MinLength(6, ErrorMessage = "Пароль має бути мінімум 6 символів")]
        [MaxLength(50, ErrorMessage = "Пароль занадто довгий")]
        public string NewPassword { get; set; } = string.Empty;
    }
}

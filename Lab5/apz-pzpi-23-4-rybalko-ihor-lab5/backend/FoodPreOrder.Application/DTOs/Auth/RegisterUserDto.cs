using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FoodPreOrder.Application.DTOs.Auth
{
    public class RegisterUserDto
    {
        [Required(ErrorMessage = "ПІБ є обов'язковим")]
        [StringLength(100, ErrorMessage = "ПІБ не може перевищувати 100 символів")]
        public string FullName { get; set; } = string.Empty;

        [Required(ErrorMessage = "Email є обов'язковим")]
        [EmailAddress(ErrorMessage = "Некоректний формат Email")]
        [StringLength(100, ErrorMessage = "Email занадто довгий")]
        public string Email { get; set; } = string.Empty;

        [Required(ErrorMessage = "Пароль є обов'язковим")]
        [MinLength(6, ErrorMessage = "Пароль має бути мінімум 6 символів")]
        [MaxLength(50, ErrorMessage = "Пароль занадто довгий")]
        public string Password { get; set; } = string.Empty;

        [Phone(ErrorMessage = "Некоректний формат телефону")]
        [StringLength(20, ErrorMessage = "Телефон занадто довгий")]
        public string Phone { get; set; } = string.Empty;
    }
}

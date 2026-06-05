using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FoodPreOrder.Application.DTOs.Auth
{
    public class ForgotPasswordDto
    {
        [Required(ErrorMessage = "Введіть Email")]
        [EmailAddress(ErrorMessage = "Некоректний формат Email")]
        [MaxLength(100)]
        public string Email { get; set; } = string.Empty;
    }
}

using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;

namespace FoodPreOrder.Application.DTOs.Restaurants
{
    public class CreateDishDto
    {
        [Required(ErrorMessage = "Назва страви є обов'язковою")]
        [MaxLength(100, ErrorMessage = "Назва не може перевищувати 100 символів")]
        public string NameUA { get; set; } = string.Empty;

        [MaxLength(100)]
        public string NameEN { get; set; } = string.Empty;

        [MaxLength(500, ErrorMessage = "Опис занадто довгий (макс 500 символів)")]
        public string DescriptionUA { get; set; } = string.Empty;

        [MaxLength(500)]
        public string DescriptionEN { get; set; } = string.Empty;

        [Required]
        [Range(0.01, 100000, ErrorMessage = "Ціна має бути більше 0")]
        public decimal Price { get; set; }

        public IFormFile? Image { get; set; }

        [Range(1, 480, ErrorMessage = "Час приготування має бути від 1 хв до 8 годин")]
        public int PreparationTimeMinutes { get; set; }

        [Required]
        public int CategoryId { get; set; }
    }
}

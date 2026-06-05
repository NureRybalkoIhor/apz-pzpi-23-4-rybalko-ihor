using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FoodPreOrder.Application.DTOs.Reviews
{
    public class CreateReviewDto
    {
        [Required(ErrorMessage = "Необхідно вказати страву (ID)")]
        public int DishId { get; set; }

        [Required(ErrorMessage = "Оцінка є обов'язковою")]
        [Range(1, 5, ErrorMessage = "Оцінка має бути від 1 до 5 зірок")]
        public int Rating { get; set; }

        [MaxLength(500, ErrorMessage = "Коментар занадто довгий (макс 500 символів)")]
        public string Comment { get; set; } = string.Empty;
    }
}

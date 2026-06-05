using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FoodPreOrder.Domain.Entities
{
    public class RestaurantDailyStat
    {
        public int Id { get; set; }
        public int RestaurantId { get; set; }
        public Restaurant? Restaurant { get; set; }

        public DateTime Date { get; set; }
        public int TotalOrders { get; set; }        // Всього
        public int SuccessfulOrders { get; set; }   // Виконаних
        public int CancelledOrders { get; set; }    // Скасованих

        // --- Блок 2: Фінанси ---
        public decimal TotalRevenue { get; set; }   // Виручка за день

        // --- Блок 3: Ефективність (Математика) ---
        // Середній час очікування (наприклад, 18.5 хв)
        public double AverageCookingTimeMinutes { get; set; }

        // Відсоток завантаженості кухні (Load Factor)
        public double LoadFactorPercent { get; set; }

        // --- Блок 4: Пікове навантаження ---
        // Година пік (наприклад, 13 означає 13:00-14:00)
        public int PeakHour { get; set; }
        // Максимальна кількість замовлень за цю годину
        public int PeakLoadCount { get; set; }
    }
}

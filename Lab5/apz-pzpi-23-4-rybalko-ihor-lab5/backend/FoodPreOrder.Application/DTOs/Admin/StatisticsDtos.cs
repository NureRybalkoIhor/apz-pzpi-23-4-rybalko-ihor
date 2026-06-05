using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FoodPreOrder.Application.DTOs.Admin
{
    public class DailyStatsDto
    {
        public DateTime Date { get; set; }
        public decimal Revenue { get; set; }
        public int OrdersCount { get; set; }
        public decimal AverageCheck { get; set; }
    }

    public class PeakLoadDto
    {
        public int Hour { get; set; }
        public int OrdersCount { get; set; }
        public string Intensity { get; set; }
    }

    public class TopDishDto
    {
        public string Name { get; set; }
        public int SoldCount { get; set; }
        public decimal TotalRevenue { get; set; }
    }

    public class AdminDashboardDto
    {
        public int TotalUsers { get; set; }
        public int ActiveRestaurants { get; set; }
        public decimal TotalSystemRevenue { get; set; }
        public int TotalOrdersToday { get; set; }

        public List<RestaurantPerformanceDto> RestaurantStats { get; set; } = new();
    }

    public class RestaurantPerformanceDto
    {
        public string RestaurantName { get; set; } = string.Empty;
        public decimal Revenue { get; set; }
        public int OrdersCount { get; set; }
        public decimal AverageCheck { get; set; }
        public int StaffCount { get; set; }
        public double RevenueShare { get; set; }
    }
}

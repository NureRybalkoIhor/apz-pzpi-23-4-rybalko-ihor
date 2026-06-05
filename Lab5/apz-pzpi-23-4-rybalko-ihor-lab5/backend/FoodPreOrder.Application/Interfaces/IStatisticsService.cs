using FoodPreOrder.Application.DTOs.Admin;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FoodPreOrder.Application.Interfaces
{
    public interface IStatisticsService
    {
        Task<List<DailyStatsDto>> GetDailyStatsAsync(int restaurantId, DateTime from, DateTime to);
        Task<List<TopDishDto>> GetTopDishesAsync(int restaurantId, int topN = 5);

        Task<AdminDashboardDto> GetSystemDashboardAsync();
        Task<List<OrderLogDto>> GetDailyOrderLogAsync(int restaurantId, DateTime date);
        Task<List<PeakLoadDto>> GetPeakLoadingAsync(int restaurantId, DateTime from, DateTime to);
    }
}

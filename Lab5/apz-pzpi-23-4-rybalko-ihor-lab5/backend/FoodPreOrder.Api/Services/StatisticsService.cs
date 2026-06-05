using FoodPreOrder.Application.DTOs.Admin;
using FoodPreOrder.Application.Interfaces;
using FoodPreOrder.Domain.Enums;
using FoodPreOrder.Persistence.Data;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace FoodPreOrder.Api.Services
{
    public class StatisticsService : IStatisticsService
    {
        private readonly ApplicationDbContext _context;

        public StatisticsService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<List<DailyStatsDto>> GetDailyStatsAsync(int restaurantId, DateTime from, DateTime to)
        {
            var query = _context.Orders
                .Where(o => o.RestaurantId == restaurantId)
                .Where(o => o.Status == OrderStatus.Completed)
                .Where(o => o.CreatedAt >= from && o.CreatedAt <= to);

            var stats = await query
                .GroupBy(o => o.CreatedAt.Date)
                .Select(g => new DailyStatsDto
                {
                    Date = g.Key,
                    Revenue = g.Sum(o => o.TotalAmount),
                    OrdersCount = g.Count(),
                    AverageCheck = g.Count() > 0 ? g.Sum(o => o.TotalAmount) / g.Count() : 0
                })
                .OrderBy(x => x.Date)
                .ToListAsync();

            return stats;
        }

        public async Task<List<PeakLoadDto>> GetPeakLoadingAsync(int restaurantId, DateTime from, DateTime to)
        {
            var hourGroups = await _context.Orders
                .Where(o => o.RestaurantId == restaurantId)
                .Where(o => o.CreatedAt >= from && o.CreatedAt <= to)
                .GroupBy(o => o.CreatedAt.Hour)
                .Select(g => new
                {
                    Hour = g.Key,
                    Count = g.Count()
                })
                .ToListAsync();

            int maxOrders = hourGroups.Any() ? hourGroups.Max(x => x.Count) : 1;

            var result = new List<PeakLoadDto>();

            for (int i = 0; i < 24; i++)
            {
                var data = hourGroups.FirstOrDefault(x => x.Hour == i);
                int count = data != null ? data.Count : 0;

                string intensity;
                if (count >= maxOrders * 0.8) intensity = "🔥 High";
                else if (count >= maxOrders * 0.4) intensity = "⚠️ Medium";
                else intensity = "🟢 Low";

                result.Add(new PeakLoadDto
                {
                    Hour = i,
                    OrdersCount = count,
                    Intensity = count > 0 ? intensity : "🟢 Low"
                });
            }

            return result;
        }

        public async Task<List<TopDishDto>> GetTopDishesAsync(int restaurantId, int topN = 5)
        {
            var topDishes = await _context.OrderItems
                .Include(oi => oi.Order)
                .Include(oi => oi.Dish)
                .Where(oi => oi.Order.RestaurantId == restaurantId && oi.Order.Status == OrderStatus.Completed)
                .GroupBy(oi => oi.Dish.NameUA)
                .Select(g => new TopDishDto
                {
                    Name = g.Key,
                    SoldCount = g.Sum(oi => oi.Quantity),
                    TotalRevenue = g.Sum(oi => oi.Price * oi.Quantity)
                })
                .OrderByDescending(x => x.SoldCount)
                .Take(topN)
                .ToListAsync();

            return topDishes;
        }

        public async Task<AdminDashboardDto> GetSystemDashboardAsync()
        {
            var totalUsers = await _context.Users.CountAsync();
            var activeRestaurantsCount = await _context.Restaurants.CountAsync(r => r.IsActive);

            var totalRevenue = await _context.Orders
                .Where(o => o.Status == OrderStatus.Completed)
                .SumAsync(o => o.TotalAmount);

            var totalOrdersToday = await _context.Orders
                .CountAsync(o => o.CreatedAt.Date == DateTime.UtcNow.Date);


            var restaurantsData = await _context.Restaurants
                .Where(r => r.IsActive)
                .Select(r => new
                {
                    Name = r.NameUA,
                    Revenue = r.Orders
                        .Where(o => o.Status == OrderStatus.Completed)
                        .Sum(o => o.TotalAmount),
                    OrdersCount = r.Orders
                        .Count(o => o.Status == OrderStatus.Completed),
                    StaffCount = _context.Users
                        .Count(u => u.RestaurantId == r.Id && u.Role == UserRole.KitchenStaff)
                })
                .ToListAsync();

            var performanceList = restaurantsData.Select(r => new RestaurantPerformanceDto
            {
                RestaurantName = r.Name,
                Revenue = r.Revenue,
                OrdersCount = r.OrdersCount,
                StaffCount = r.StaffCount,
                AverageCheck = r.OrdersCount > 0 ? r.Revenue / r.OrdersCount : 0,
                RevenueShare = totalRevenue > 0 ? (double)(r.Revenue / totalRevenue) * 100 : 0
            })
            .OrderByDescending(x => x.Revenue)
            .ToList();

            return new AdminDashboardDto
            {
                TotalUsers = totalUsers,
                ActiveRestaurants = activeRestaurantsCount,
                TotalSystemRevenue = totalRevenue,
                TotalOrdersToday = totalOrdersToday,
                RestaurantStats = performanceList
            };
        }

        public async Task<List<OrderLogDto>> GetDailyOrderLogAsync(int restaurantId, DateTime date)
        {
            var logs = await _context.Orders
                .Include(o => o.User)
                .Include(o => o.Items)
                .ThenInclude(oi => oi.Dish)
                .Where(o => o.RestaurantId == restaurantId)
                .Where(o => o.CreatedAt.Date == date.Date)
                .OrderBy(o => o.CreatedAt)
                .Select(o => new OrderLogDto
                {
                    OrderId = o.Id,
                    Time = o.CreatedAt,
                    CustomerName = o.User != null ? o.User.FullName : "Невідомий",
                    ItemsSummary = string.Join(", ", o.Items.Select(i => $"{i.Dish.NameUA} ({i.Quantity})")),
                    TotalAmount = o.TotalAmount,
                    Status = o.Status.ToString()
                })
                .ToListAsync();

            return logs;
        }
    }
}

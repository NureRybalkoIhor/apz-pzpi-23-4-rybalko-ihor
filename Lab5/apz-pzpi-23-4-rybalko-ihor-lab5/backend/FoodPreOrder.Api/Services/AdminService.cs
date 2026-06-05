using FoodPreOrder.Application.DTOs.Admin;
using FoodPreOrder.Application.Interfaces;
using FoodPreOrder.Domain.Entities;
using FoodPreOrder.Domain.Enums;
using FoodPreOrder.Persistence.Data;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace FoodPreOrder.Api.Services
{
    public class AdminService : IAdminService
    {
        private readonly ApplicationDbContext _context;

        public AdminService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<bool> BlockUserAsync(int adminId, BlockUserDto dto)
        {
            var user = await _context.Users.FindAsync(dto.UserId);
            if (user == null) return false;

            if (user.Role == UserRole.Admin)
            {
                throw new InvalidOperationException("Адміністратора не можна заблокувати.");
            }

            user.IsBlocked = true;

            var log = new ActivityLog
            {
                UserId = adminId,
                Action = "UserBlocked",
                EntityName = "Users",
                EntityId = user.Id.ToString(),
                Details = $"Причина: {dto.Reason}",
                Timestamp = DateTime.UtcNow
            };

            _context.ActivityLogs.Add(log);
            await _context.SaveChangesAsync();

            return true;
        }

        public async Task<bool> UnblockUserAsync(int adminId, int userId)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null) return false;

            user.IsBlocked = false;

            var log = new ActivityLog
            {
                UserId = adminId,
                Action = "UserUnblocked",
                EntityName = "Users",
                EntityId = user.Id.ToString(),
                Details = "Розблоковано адміністратором",
                Timestamp = DateTime.UtcNow
            };

            _context.ActivityLogs.Add(log);
            await _context.SaveChangesAsync();

            return true;
        }

        public async Task<List<ActivityLog>> GetRecentLogsAsync()
        {
            return await _context.ActivityLogs
                .Include(l => l.User)
                .OrderByDescending(l => l.Timestamp)
                .Take(50)
                .ToListAsync();
        }

        public async Task<List<UserSummaryDto>> GetAllUsersAsync()
        {
            return await _context.Users
                .Select(u => new UserSummaryDto
                {
                    Id = u.Id,
                    FullName = u.FullName,
                    Email = u.Email,
                    Role = u.Role.ToString(),
                    IsBlocked = u.IsBlocked
                })
                .ToListAsync();
        }

        public async Task<bool> ChangeUserRoleAsync(int adminId, ChangeRoleDto dto)
        {
            var user = await _context.Users.FindAsync(dto.UserId);
            if (user == null) return false;

            var oldRole = user.Role;

            user.Role = dto.NewRole;

            var log = new ActivityLog
            {
                UserId = adminId,
                Action = "RoleChanged",
                EntityName = "Users",
                EntityId = user.Id.ToString(),
                Details = $"Змінено роль з {oldRole} на {dto.NewRole}",
                Timestamp = DateTime.UtcNow
            };

            _context.ActivityLogs.Add(log);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> ToggleRestaurantStatusAsync(int adminId, int restaurantId, bool isActive)
        {
            var restaurant = await _context.Restaurants.FindAsync(restaurantId);
            if (restaurant == null) return false;

            restaurant.IsActive = isActive;

            var log = new ActivityLog
            {
                UserId = adminId,
                Action = isActive ? "RestaurantActivated" : "RestaurantBlocked",
                EntityName = "Restaurants",
                EntityId = restaurant.Id.ToString(),
                Details = $"Статус ресторану змінено на: {(isActive ? "Активний" : "Заблокований")}",
                Timestamp = DateTime.UtcNow
            };

            _context.ActivityLogs.Add(log);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<List<SystemSetting>> GetSystemSettingsAsync()
        {
            return await _context.SystemSettings.ToListAsync();
        }

        public async Task<bool> UpdateSystemSettingAsync(int adminId, UpdateSettingDto dto)
        {
            var setting = await _context.SystemSettings.FirstOrDefaultAsync(s => s.Key == dto.Key);

            if (setting == null)
            {
                setting = new SystemSetting { Key = dto.Key, Value = dto.Value };
                _context.SystemSettings.Add(setting);
            }
            else
            {
                setting.Value = dto.Value;
            }

            var log = new ActivityLog
            {
                UserId = adminId,
                Action = "SettingChanged",
                EntityName = "SystemSettings",
                EntityId = dto.Key,
                Details = $"Нове значення: {dto.Value}",
                Timestamp = DateTime.UtcNow
            };

            _context.ActivityLogs.Add(log);
            await _context.SaveChangesAsync();
            return true;
        }
    }
}

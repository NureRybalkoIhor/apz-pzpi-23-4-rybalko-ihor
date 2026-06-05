using FoodPreOrder.Application.DTOs.Admin;
using FoodPreOrder.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FoodPreOrder.Application.Interfaces
{
    public interface IAdminService
    {
        Task<bool> BlockUserAsync(int adminId, BlockUserDto dto);

        Task<bool> UnblockUserAsync(int adminId, int userId);

        Task<bool> ChangeUserRoleAsync(int adminId, ChangeRoleDto dto);

        Task<bool> ToggleRestaurantStatusAsync(int adminId, int restaurantId, bool isActive);

        Task<bool> UpdateSystemSettingAsync(int adminId, UpdateSettingDto dto);

        Task<List<ActivityLog>> GetRecentLogsAsync();
        Task<List<UserSummaryDto>> GetAllUsersAsync();

        Task<List<SystemSetting>> GetSystemSettingsAsync();
    }
}

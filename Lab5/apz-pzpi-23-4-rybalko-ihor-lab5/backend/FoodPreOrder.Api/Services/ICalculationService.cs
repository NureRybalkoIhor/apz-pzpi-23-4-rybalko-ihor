using FoodPreOrder.Domain.Entities;

namespace FoodPreOrder.Api.Services
{
    public interface ICalculationService
    {
        double CalculateDistance(double lat1, double lon1, double lat2, double lon2);

        DateTime CalculateEstimatedReadyTime(DateTime orderTime, List<Dish> dishes);
    }
}

using FoodPreOrder.Domain.Entities;

namespace FoodPreOrder.Api.Services
{
    public class CalculationService : ICalculationService
    {
        public double CalculateDistance(double lat1, double lon1, double lat2, double lon2)
        {
            const double EarthRadiusKm = 6371.0;

            var dLat = DegreesToRadians(lat2 - lat1);
            var dLon = DegreesToRadians(lon2 - lon1);

            var lat1Rad = DegreesToRadians(lat1);
            var lat2Rad = DegreesToRadians(lat2);

            var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                    Math.Sin(dLon / 2) * Math.Sin(dLon / 2) *
                    Math.Cos(lat1Rad) * Math.Cos(lat2Rad);

            var c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));

            return Math.Round(EarthRadiusKm * c, 1);
        }

        private double DegreesToRadians(double degrees)
        {
            return degrees * Math.PI / 180.0;
        }

        public DateTime CalculateEstimatedReadyTime(DateTime orderTime, List<Dish> dishes)
        {
            if (dishes == null || !dishes.Any())
                return orderTime;


            int maxPrepTime = dishes.Max(d => d.PreparationTimeMinutes);
            int bufferTime = 5;

            return orderTime.AddMinutes(maxPrepTime + bufferTime);
        }
    }
}

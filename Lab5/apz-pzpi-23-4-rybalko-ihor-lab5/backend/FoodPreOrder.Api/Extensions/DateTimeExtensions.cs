namespace FoodPreOrder.Api.Extensions
{
    public static class DateTimeExtensions
    {
        public static DateTime ToUkraineTime(this DateTime utcDateTime)
        {
            TimeZoneInfo ukraineZone;
            try
            {
                ukraineZone = TimeZoneInfo.FindSystemTimeZoneById("Europe/Kyiv");
            }
            catch
            {
                ukraineZone = TimeZoneInfo.FindSystemTimeZoneById("FLE Standard Time");
            }

            return TimeZoneInfo.ConvertTimeFromUtc(utcDateTime, ukraineZone);
        }
    }
}

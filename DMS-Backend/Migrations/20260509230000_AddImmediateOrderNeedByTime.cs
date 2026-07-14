using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DMS_Backend.Migrations;

/// <summary>
/// Customer need-by time-of-day for immediate orders (pairs with need_by_date).
/// </summary>
public partial class AddImmediateOrderNeedByTime : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
            ALTER TABLE immediate_orders
              ADD COLUMN IF NOT EXISTS need_by_time character varying(20) NULL;
            """);

        migrationBuilder.Sql("""
            UPDATE immediate_orders
            SET need_by_time = COALESCE(NULLIF(trim(need_by_time), ''), '12:00')
            WHERE need_by_date IS NOT NULL
              AND (need_by_time IS NULL OR trim(need_by_time) = '');
            """);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("ALTER TABLE immediate_orders DROP COLUMN IF EXISTS need_by_time;");
    }
}

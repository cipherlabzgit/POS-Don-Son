using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DMS_Backend.Migrations;

/// <summary>
/// Showroom / POS Anytime Order Request fields aligned with <see cref="Models.Entities.OrderHeader"/>.
/// </summary>
public partial class AddImmediateOrderSchedulingFields : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
            ALTER TABLE immediate_orders
              ADD COLUMN IF NOT EXISTS order_bill_no character varying(50) NULL;

            ALTER TABLE immediate_orders
              ADD COLUMN IF NOT EXISTS delivery_date date NULL;

            ALTER TABLE immediate_orders
              ADD COLUMN IF NOT EXISTS delivery_time character varying(20) NULL;

            ALTER TABLE immediate_orders
              ADD COLUMN IF NOT EXISTS production_start_date date NULL;

            ALTER TABLE immediate_orders
              ADD COLUMN IF NOT EXISTS production_start_time character varying(20) NULL;

            ALTER TABLE immediate_orders
              ADD COLUMN IF NOT EXISTS recipe_request_number character varying(100) NULL;
            """);

        migrationBuilder.Sql("""
            UPDATE immediate_orders
            SET delivery_date = (order_date AT TIME ZONE 'UTC')::date,
                delivery_time = '10:00',
                production_start_date = (order_date AT TIME ZONE 'UTC')::date,
                production_start_time = '08:00',
                recipe_request_number = COALESCE(recipe_request_number, '')
            WHERE delivery_date IS NULL OR recipe_request_number IS NULL;
            """);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
            ALTER TABLE immediate_orders DROP COLUMN IF EXISTS recipe_request_number;
            ALTER TABLE immediate_orders DROP COLUMN IF EXISTS production_start_time;
            ALTER TABLE immediate_orders DROP COLUMN IF EXISTS production_start_date;
            ALTER TABLE immediate_orders DROP COLUMN IF EXISTS delivery_time;
            ALTER TABLE immediate_orders DROP COLUMN IF EXISTS delivery_date;
            ALTER TABLE immediate_orders DROP COLUMN IF EXISTS order_bill_no;
            """);
    }
}

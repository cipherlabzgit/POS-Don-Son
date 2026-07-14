using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DMS_Backend.Migrations
{
    public partial class MakeOutletEmployeeUserIdNullable : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                @"DO $EF$
                BEGIN
                  IF EXISTS (
                    SELECT 1 FROM information_schema.table_constraints
                    WHERE constraint_name = 'FK_outlet_employees_users_user_id'
                      AND table_name = 'outlet_employees'
                  ) THEN
                    ALTER TABLE outlet_employees DROP CONSTRAINT ""FK_outlet_employees_users_user_id"";
                  END IF;

                  ALTER TABLE outlet_employees ALTER COLUMN user_id DROP NOT NULL;

                  ALTER TABLE outlet_employees
                    ADD CONSTRAINT ""FK_outlet_employees_users_user_id""
                    FOREIGN KEY (user_id) REFERENCES users(""Id"") ON DELETE SET NULL;
                END $EF$;");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                @"DO $EF$
                BEGIN
                  IF EXISTS (
                    SELECT 1 FROM information_schema.table_constraints
                    WHERE constraint_name = 'FK_outlet_employees_users_user_id'
                      AND table_name = 'outlet_employees'
                  ) THEN
                    ALTER TABLE outlet_employees DROP CONSTRAINT ""FK_outlet_employees_users_user_id"";
                  END IF;

                  ALTER TABLE outlet_employees ALTER COLUMN user_id SET NOT NULL;

                  ALTER TABLE outlet_employees
                    ADD CONSTRAINT ""FK_outlet_employees_users_user_id""
                    FOREIGN KEY (user_id) REFERENCES users(""Id"") ON DELETE RESTRICT;
                END $EF$;");
        }
    }
}

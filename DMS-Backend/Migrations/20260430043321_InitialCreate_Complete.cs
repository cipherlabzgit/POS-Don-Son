using System;
using System.Text.Json;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DMS_Backend.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate_Complete : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "api_request_logs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: true),
                    Email = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    RequestId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Endpoint = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    HttpMethod = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    QueryString = table.Column<string>(type: "text", nullable: true),
                    RequestBody = table.Column<JsonDocument>(type: "jsonb", nullable: true),
                    ResponseStatusCode = table.Column<int>(type: "integer", nullable: true),
                    ResponseTimeMs = table.Column<int>(type: "integer", nullable: true),
                    IpAddress = table.Column<string>(type: "character varying(45)", maxLength: 45, nullable: true),
                    UserAgent = table.Column<string>(type: "text", nullable: true),
                    IsSuccessful = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    ErrorMessage = table.Column<string>(type: "text", nullable: true),
                    Timestamp = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_api_request_logs", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "audit_logs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: true),
                    Email = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    EventType = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    EntityType = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    EntityId = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    Action = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    OldValues = table.Column<JsonDocument>(type: "jsonb", nullable: true),
                    NewValues = table.Column<JsonDocument>(type: "jsonb", nullable: true),
                    IpAddress = table.Column<string>(type: "character varying(45)", maxLength: 45, nullable: true),
                    UserAgent = table.Column<string>(type: "text", nullable: true),
                    RequestPath = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    RequestMethod = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: true),
                    StatusCode = table.Column<int>(type: "integer", nullable: true),
                    ErrorMessage = table.Column<string>(type: "text", nullable: true),
                    Timestamp = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_audit_logs", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "permissions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Code = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Module = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Description = table.Column<string>(type: "text", nullable: true),
                    IsSystemPermission = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    DisplayOrder = table.Column<int>(type: "integer", nullable: true, defaultValue: 0),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_permissions", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "system_logs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    LogLevel = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Category = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    Message = table.Column<string>(type: "text", nullable: false),
                    Exception = table.Column<string>(type: "text", nullable: true),
                    AdditionalData = table.Column<JsonDocument>(type: "jsonb", nullable: true),
                    Timestamp = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_system_logs", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "users",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Email = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    FirstName = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    LastName = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Phone = table.Column<string>(type: "text", nullable: true),
                    PasswordHash = table.Column<string>(type: "text", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    IsSuperAdmin = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    LastLoginAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()"),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_users", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "approval_queue",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    approval_type = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    entity_id = table.Column<Guid>(type: "uuid", nullable: false),
                    entity_reference = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    requested_by_id = table.Column<Guid>(type: "uuid", nullable: false),
                    requested_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    approved_by_id = table.Column<Guid>(type: "uuid", nullable: true),
                    approved_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    rejection_reason = table.Column<string>(type: "text", nullable: true),
                    request_data = table.Column<string>(type: "jsonb", nullable: true),
                    priority = table.Column<int>(type: "integer", nullable: false),
                    notes = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedById = table.Column<Guid>(type: "uuid", nullable: true),
                    UpdatedById = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_approval_queue", x => x.Id);
                    table.ForeignKey(
                        name: "FK_approval_queue_users_CreatedById",
                        column: x => x.CreatedById,
                        principalTable: "users",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_approval_queue_users_UpdatedById",
                        column: x => x.UpdatedById,
                        principalTable: "users",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_approval_queue_users_approved_by_id",
                        column: x => x.approved_by_id,
                        principalTable: "users",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_approval_queue_users_requested_by_id",
                        column: x => x.requested_by_id,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "authentication_logs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Email = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: true),
                    EventType = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    FailureReason = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    IpAddress = table.Column<string>(type: "character varying(45)", maxLength: 45, nullable: true),
                    UserAgent = table.Column<string>(type: "text", nullable: true),
                    SessionId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    Timestamp = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_authentication_logs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_authentication_logs_users_UserId",
                        column: x => x.UserId,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "categories",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Code = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()"),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()"),
                    CreatedById = table.Column<Guid>(type: "uuid", nullable: true),
                    UpdatedById = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_categories", x => x.Id);
                    table.ForeignKey(
                        name: "FK_categories_users_CreatedById",
                        column: x => x.CreatedById,
                        principalTable: "users",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_categories_users_UpdatedById",
                        column: x => x.UpdatedById,
                        principalTable: "users",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "day_locks",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    LockDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    IsLocked = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    LockedBy = table.Column<Guid>(type: "uuid", nullable: true),
                    LockedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    LockReason = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()"),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_day_locks", x => x.Id);
                    table.ForeignKey(
                        name: "FK_day_locks_users_LockedBy",
                        column: x => x.LockedBy,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "day_types",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    code = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    color_code = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    icon_name = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    sort_order = table.Column<int>(type: "integer", nullable: false),
                    apply_multiplier = table.Column<bool>(type: "boolean", nullable: false),
                    quantity_multiplier = table.Column<decimal>(type: "numeric(5,2)", nullable: false),
                    is_system_type = table.Column<bool>(type: "boolean", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedById = table.Column<Guid>(type: "uuid", nullable: true),
                    UpdatedById = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_day_types", x => x.Id);
                    table.ForeignKey(
                        name: "FK_day_types_users_CreatedById",
                        column: x => x.CreatedById,
                        principalTable: "users",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_day_types_users_UpdatedById",
                        column: x => x.UpdatedById,
                        principalTable: "users",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "delivery_turns",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    code = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    turn_number = table.Column<int>(type: "integer", nullable: false),
                    delivery_time = table.Column<TimeSpan>(type: "interval", nullable: false),
                    order_cutoff_time = table.Column<TimeSpan>(type: "interval", nullable: true),
                    production_start_time = table.Column<TimeSpan>(type: "interval", nullable: true),
                    crosses_midnight = table.Column<bool>(type: "boolean", nullable: false),
                    sort_order = table.Column<int>(type: "integer", nullable: false),
                    allow_immediate_orders = table.Column<bool>(type: "boolean", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedById = table.Column<Guid>(type: "uuid", nullable: true),
                    UpdatedById = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_delivery_turns", x => x.Id);
                    table.ForeignKey(
                        name: "FK_delivery_turns_users_CreatedById",
                        column: x => x.CreatedById,
                        principalTable: "users",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_delivery_turns_users_UpdatedById",
                        column: x => x.UpdatedById,
                        principalTable: "users",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "grid_configurations",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    grid_name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    user_id = table.Column<Guid>(type: "uuid", nullable: true),
                    configuration_name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    column_settings = table.Column<string>(type: "jsonb", nullable: true),
                    sort_settings = table.Column<string>(type: "jsonb", nullable: true),
                    filter_settings = table.Column<string>(type: "jsonb", nullable: true),
                    page_size = table.Column<int>(type: "integer", nullable: true),
                    is_default = table.Column<bool>(type: "boolean", nullable: false),
                    is_shared = table.Column<bool>(type: "boolean", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedById = table.Column<Guid>(type: "uuid", nullable: true),
                    UpdatedById = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_grid_configurations", x => x.Id);
                    table.ForeignKey(
                        name: "FK_grid_configurations_users_CreatedById",
                        column: x => x.CreatedById,
                        principalTable: "users",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_grid_configurations_users_UpdatedById",
                        column: x => x.UpdatedById,
                        principalTable: "users",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_grid_configurations_users_user_id",
                        column: x => x.user_id,
                        principalTable: "users",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "label_settings",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    setting_key = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    setting_name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    setting_value = table.Column<string>(type: "text", nullable: true),
                    description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    category = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    value_type = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    sort_order = table.Column<int>(type: "integer", nullable: false),
                    is_system_setting = table.Column<bool>(type: "boolean", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedById = table.Column<Guid>(type: "uuid", nullable: true),
                    UpdatedById = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_label_settings", x => x.Id);
                    table.ForeignKey(
                        name: "FK_label_settings_users_CreatedById",
                        column: x => x.CreatedById,
                        principalTable: "users",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_label_settings_users_UpdatedById",
                        column: x => x.UpdatedById,
                        principalTable: "users",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "label_templates",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    code = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    template_type = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    width_mm = table.Column<decimal>(type: "numeric", nullable: false),
                    height_mm = table.Column<decimal>(type: "numeric", nullable: false),
                    layout_design = table.Column<string>(type: "text", nullable: true),
                    fields = table.Column<string>(type: "jsonb", nullable: true),
                    font_settings = table.Column<string>(type: "jsonb", nullable: true),
                    sort_order = table.Column<int>(type: "integer", nullable: false),
                    is_default = table.Column<bool>(type: "boolean", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedById = table.Column<Guid>(type: "uuid", nullable: true),
                    UpdatedById = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_label_templates", x => x.Id);
                    table.ForeignKey(
                        name: "FK_label_templates_users_CreatedById",
                        column: x => x.CreatedById,
                        principalTable: "users",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_label_templates_users_UpdatedById",
                        column: x => x.UpdatedById,
                        principalTable: "users",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "password_reset_tokens",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    Token = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    ExpiresAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    IsUsed = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()"),
                    UsedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_password_reset_tokens", x => x.Id);
                    table.ForeignKey(
                        name: "FK_password_reset_tokens_users_UserId",
                        column: x => x.UserId,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "price_lists",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    code = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    price_list_type = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    currency = table.Column<string>(type: "character varying(3)", maxLength: 3, nullable: false),
                    effective_from = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    effective_to = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    is_default = table.Column<bool>(type: "boolean", nullable: false),
                    priority = table.Column<int>(type: "integer", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedById = table.Column<Guid>(type: "uuid", nullable: true),
                    UpdatedById = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_price_lists", x => x.Id);
                    table.ForeignKey(
                        name: "FK_price_lists_users_CreatedById",
                        column: x => x.CreatedById,
                        principalTable: "users",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_price_lists_users_UpdatedById",
                        column: x => x.UpdatedById,
                        principalTable: "users",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "production_sections",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    code = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    sort_order = table.Column<int>(type: "integer", nullable: false),
                    color_code = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    icon_name = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    department = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    supervisor_name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    requires_sin = table.Column<bool>(type: "boolean", nullable: false),
                    has_production_planner = table.Column<bool>(type: "boolean", nullable: false),
                    default_production_start_time = table.Column<TimeSpan>(type: "interval", nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedById = table.Column<Guid>(type: "uuid", nullable: true),
                    UpdatedById = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_production_sections", x => x.Id);
                    table.ForeignKey(
                        name: "FK_production_sections_users_CreatedById",
                        column: x => x.CreatedById,
                        principalTable: "users",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_production_sections_users_UpdatedById",
                        column: x => x.UpdatedById,
                        principalTable: "users",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "roles",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Description = table.Column<string>(type: "text", nullable: true),
                    IsSystemRole = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    CreatedById = table.Column<Guid>(type: "uuid", nullable: true),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()"),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_roles", x => x.Id);
                    table.ForeignKey(
                        name: "FK_roles_users_CreatedById",
                        column: x => x.CreatedById,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "rounding_rules",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    code = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    applies_to = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    rounding_method = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    decimal_places = table.Column<int>(type: "integer", nullable: false),
                    rounding_increment = table.Column<decimal>(type: "numeric(10,4)", nullable: false),
                    min_value = table.Column<decimal>(type: "numeric(18,4)", nullable: true),
                    max_value = table.Column<decimal>(type: "numeric(18,4)", nullable: true),
                    sort_order = table.Column<int>(type: "integer", nullable: false),
                    is_default = table.Column<bool>(type: "boolean", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedById = table.Column<Guid>(type: "uuid", nullable: true),
                    UpdatedById = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_rounding_rules", x => x.Id);
                    table.ForeignKey(
                        name: "FK_rounding_rules_users_CreatedById",
                        column: x => x.CreatedById,
                        principalTable: "users",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_rounding_rules_users_UpdatedById",
                        column: x => x.UpdatedById,
                        principalTable: "users",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "security_policies",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    policy_key = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    policy_name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    category = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    policy_value = table.Column<string>(type: "text", nullable: true),
                    value_type = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    is_enforced = table.Column<bool>(type: "boolean", nullable: false),
                    is_system_policy = table.Column<bool>(type: "boolean", nullable: false),
                    severity_level = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    last_reviewed_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    sort_order = table.Column<int>(type: "integer", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedById = table.Column<Guid>(type: "uuid", nullable: true),
                    UpdatedById = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_security_policies", x => x.Id);
                    table.ForeignKey(
                        name: "FK_security_policies_users_CreatedById",
                        column: x => x.CreatedById,
                        principalTable: "users",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_security_policies_users_UpdatedById",
                        column: x => x.UpdatedById,
                        principalTable: "users",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "shifts",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    code = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    start_time = table.Column<TimeSpan>(type: "interval", nullable: false),
                    end_time = table.Column<TimeSpan>(type: "interval", nullable: false),
                    description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    display_order = table.Column<int>(type: "integer", nullable: false),
                    is_active = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()"),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()"),
                    CreatedById = table.Column<Guid>(type: "uuid", nullable: true),
                    UpdatedById = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_shifts", x => x.Id);
                    table.ForeignKey(
                        name: "FK_shifts_users_CreatedById",
                        column: x => x.CreatedById,
                        principalTable: "users",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_shifts_users_UpdatedById",
                        column: x => x.UpdatedById,
                        principalTable: "users",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "system_settings",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    setting_key = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    setting_name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    setting_value = table.Column<string>(type: "text", nullable: true),
                    setting_type = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    category = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    is_system_setting = table.Column<bool>(type: "boolean", nullable: false),
                    is_encrypted = table.Column<bool>(type: "boolean", nullable: false),
                    display_order = table.Column<int>(type: "integer", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedById = table.Column<Guid>(type: "uuid", nullable: true),
                    UpdatedById = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_system_settings", x => x.Id);
                    table.ForeignKey(
                        name: "FK_system_settings_users_CreatedById",
                        column: x => x.CreatedById,
                        principalTable: "users",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_system_settings_users_UpdatedById",
                        column: x => x.UpdatedById,
                        principalTable: "users",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "unit_of_measures",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Code = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    Description = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()"),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()"),
                    CreatedById = table.Column<Guid>(type: "uuid", nullable: true),
                    UpdatedById = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_unit_of_measures", x => x.Id);
                    table.ForeignKey(
                        name: "FK_unit_of_measures_users_CreatedById",
                        column: x => x.CreatedById,
                        principalTable: "users",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_unit_of_measures_users_UpdatedById",
                        column: x => x.UpdatedById,
                        principalTable: "users",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "workflow_configs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    code = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    entity_type = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    workflow_type = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    requires_approval = table.Column<bool>(type: "boolean", nullable: false),
                    approval_levels = table.Column<int>(type: "integer", nullable: false),
                    auto_approve_threshold = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    approval_steps = table.Column<string>(type: "jsonb", nullable: true),
                    notification_settings = table.Column<string>(type: "jsonb", nullable: true),
                    timeout_hours = table.Column<int>(type: "integer", nullable: true),
                    escalation_config = table.Column<string>(type: "jsonb", nullable: true),
                    is_enabled = table.Column<bool>(type: "boolean", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedById = table.Column<Guid>(type: "uuid", nullable: true),
                    UpdatedById = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_workflow_configs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_workflow_configs_users_CreatedById",
                        column: x => x.CreatedById,
                        principalTable: "users",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_workflow_configs_users_UpdatedById",
                        column: x => x.UpdatedById,
                        principalTable: "users",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "recipe_templates",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Code = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    CategoryId = table.Column<Guid>(type: "uuid", nullable: true),
                    IsDefault = table.Column<bool>(type: "boolean", nullable: false),
                    SortOrder = table.Column<int>(type: "integer", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()"),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()"),
                    CreatedById = table.Column<Guid>(type: "uuid", nullable: true),
                    UpdatedById = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_recipe_templates", x => x.Id);
                    table.ForeignKey(
                        name: "FK_recipe_templates_categories_CategoryId",
                        column: x => x.CategoryId,
                        principalTable: "categories",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_recipe_templates_users_CreatedById",
                        column: x => x.CreatedById,
                        principalTable: "users",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_recipe_templates_users_UpdatedById",
                        column: x => x.UpdatedById,
                        principalTable: "users",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "delivery_plans",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    plan_no = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    plan_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    delivery_turn_id = table.Column<Guid>(type: "uuid", nullable: false),
                    day_type_id = table.Column<Guid>(type: "uuid", nullable: false),
                    status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    use_freezer_stock = table.Column<bool>(type: "boolean", nullable: false),
                    excluded_outlets = table.Column<string>(type: "jsonb", nullable: true),
                    excluded_products = table.Column<string>(type: "jsonb", nullable: true),
                    notes = table.Column<string>(type: "text", nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()"),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()"),
                    CreatedById = table.Column<Guid>(type: "uuid", nullable: true),
                    UpdatedById = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_delivery_plans", x => x.Id);
                    table.ForeignKey(
                        name: "FK_delivery_plans_day_types_day_type_id",
                        column: x => x.day_type_id,
                        principalTable: "day_types",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_delivery_plans_delivery_turns_delivery_turn_id",
                        column: x => x.delivery_turn_id,
                        principalTable: "delivery_turns",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_delivery_plans_users_CreatedById",
                        column: x => x.CreatedById,
                        principalTable: "users",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_delivery_plans_users_UpdatedById",
                        column: x => x.UpdatedById,
                        principalTable: "users",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "outlets",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    code = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    address = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    phone = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    contact_person = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    display_order = table.Column<int>(type: "integer", nullable: false),
                    location_type = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    has_variants = table.Column<bool>(type: "boolean", nullable: false),
                    is_delivery_point = table.Column<bool>(type: "boolean", nullable: false),
                    default_delivery_turn_id = table.Column<Guid>(type: "uuid", nullable: true),
                    latitude = table.Column<decimal>(type: "numeric", nullable: true),
                    longitude = table.Column<decimal>(type: "numeric", nullable: true),
                    operating_hours = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    notes = table.Column<string>(type: "text", nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedById = table.Column<Guid>(type: "uuid", nullable: true),
                    UpdatedById = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_outlets", x => x.Id);
                    table.ForeignKey(
                        name: "FK_outlets_delivery_turns_default_delivery_turn_id",
                        column: x => x.default_delivery_turn_id,
                        principalTable: "delivery_turns",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_outlets_users_CreatedById",
                        column: x => x.CreatedById,
                        principalTable: "users",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_outlets_users_UpdatedById",
                        column: x => x.UpdatedById,
                        principalTable: "users",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "role_permissions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    RoleId = table.Column<Guid>(type: "uuid", nullable: false),
                    PermissionId = table.Column<Guid>(type: "uuid", nullable: false),
                    GrantedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_role_permissions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_role_permissions_permissions_PermissionId",
                        column: x => x.PermissionId,
                        principalTable: "permissions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_role_permissions_roles_RoleId",
                        column: x => x.RoleId,
                        principalTable: "roles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "user_roles",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    RoleId = table.Column<Guid>(type: "uuid", nullable: false),
                    AssignedById = table.Column<Guid>(type: "uuid", nullable: true),
                    AssignedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_user_roles", x => x.Id);
                    table.ForeignKey(
                        name: "FK_user_roles_roles_RoleId",
                        column: x => x.RoleId,
                        principalTable: "roles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_user_roles_users_AssignedById",
                        column: x => x.AssignedById,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_user_roles_users_UserId",
                        column: x => x.UserId,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ingredients",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Code = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    CategoryId = table.Column<Guid>(type: "uuid", nullable: false),
                    UnitOfMeasureId = table.Column<Guid>(type: "uuid", nullable: false),
                    IngredientType = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    IsSemiFinishedItem = table.Column<bool>(type: "boolean", nullable: false),
                    ExtraPercentageApplicable = table.Column<bool>(type: "boolean", nullable: false),
                    ExtraPercentage = table.Column<decimal>(type: "numeric(18,2)", nullable: false, defaultValue: 0m),
                    AllowDecimal = table.Column<bool>(type: "boolean", nullable: false),
                    DecimalPlaces = table.Column<int>(type: "integer", nullable: false),
                    UnitPrice = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    SortOrder = table.Column<int>(type: "integer", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()"),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()"),
                    CreatedById = table.Column<Guid>(type: "uuid", nullable: true),
                    UpdatedById = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ingredients", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ingredients_categories_CategoryId",
                        column: x => x.CategoryId,
                        principalTable: "categories",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ingredients_unit_of_measures_UnitOfMeasureId",
                        column: x => x.UnitOfMeasureId,
                        principalTable: "unit_of_measures",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ingredients_users_CreatedById",
                        column: x => x.CreatedById,
                        principalTable: "users",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_ingredients_users_UpdatedById",
                        column: x => x.UpdatedById,
                        principalTable: "users",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "products",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Code = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    CategoryId = table.Column<Guid>(type: "uuid", nullable: false),
                    UnitOfMeasureId = table.Column<Guid>(type: "uuid", nullable: false),
                    UnitPrice = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    ProductType = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    ProductionSection = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    HasFullSize = table.Column<bool>(type: "boolean", nullable: false),
                    HasMiniSize = table.Column<bool>(type: "boolean", nullable: false),
                    AllowDecimal = table.Column<bool>(type: "boolean", nullable: false),
                    DecimalPlaces = table.Column<int>(type: "integer", nullable: false),
                    RoundingValue = table.Column<int>(type: "integer", nullable: false),
                    IsPlainRollItem = table.Column<bool>(type: "boolean", nullable: false),
                    RequireOpenStock = table.Column<bool>(type: "boolean", nullable: false),
                    EnableLabelPrint = table.Column<bool>(type: "boolean", nullable: false),
                    AllowFutureLabelPrint = table.Column<bool>(type: "boolean", nullable: false),
                    SortOrder = table.Column<int>(type: "integer", nullable: false),
                    DefaultDeliveryTurns = table.Column<string>(type: "jsonb", nullable: true),
                    AvailableInTurns = table.Column<string>(type: "jsonb", nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()"),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()"),
                    CreatedById = table.Column<Guid>(type: "uuid", nullable: true),
                    UpdatedById = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_products", x => x.Id);
                    table.ForeignKey(
                        name: "FK_products_categories_CategoryId",
                        column: x => x.CategoryId,
                        principalTable: "categories",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_products_unit_of_measures_UnitOfMeasureId",
                        column: x => x.UnitOfMeasureId,
                        principalTable: "unit_of_measures",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_products_users_CreatedById",
                        column: x => x.CreatedById,
                        principalTable: "users",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_products_users_UpdatedById",
                        column: x => x.UpdatedById,
                        principalTable: "users",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "order_headers",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    order_no = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    order_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    delivery_plan_id = table.Column<Guid>(type: "uuid", nullable: true),
                    status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    use_freezer_stock = table.Column<bool>(type: "boolean", nullable: false),
                    total_items = table.Column<int>(type: "integer", nullable: false),
                    notes = table.Column<string>(type: "text", nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()"),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()"),
                    CreatedById = table.Column<Guid>(type: "uuid", nullable: true),
                    UpdatedById = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_order_headers", x => x.Id);
                    table.ForeignKey(
                        name: "FK_order_headers_delivery_plans_delivery_plan_id",
                        column: x => x.delivery_plan_id,
                        principalTable: "delivery_plans",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_order_headers_users_CreatedById",
                        column: x => x.CreatedById,
                        principalTable: "users",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_order_headers_users_UpdatedById",
                        column: x => x.UpdatedById,
                        principalTable: "users",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "production_plans",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    DeliveryPlanId = table.Column<Guid>(type: "uuid", nullable: false),
                    ComputedDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Status = table.Column<string>(type: "text", nullable: false),
                    UseFreezerStock = table.Column<bool>(type: "boolean", nullable: false),
                    TotalProducts = table.Column<int>(type: "integer", nullable: false),
                    TotalQuantity = table.Column<decimal>(type: "numeric(18,4)", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()"),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_production_plans", x => x.Id);
                    table.ForeignKey(
                        name: "FK_production_plans_delivery_plans_DeliveryPlanId",
                        column: x => x.DeliveryPlanId,
                        principalTable: "delivery_plans",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "cancellations",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    cancellation_no = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    cancellation_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    delivery_no = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    delivered_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    outlet_id = table.Column<Guid>(type: "uuid", nullable: false),
                    reason = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    status = table.Column<string>(type: "text", nullable: false),
                    approved_by_id = table.Column<Guid>(type: "uuid", nullable: true),
                    approved_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()"),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()"),
                    CreatedById = table.Column<Guid>(type: "uuid", nullable: true),
                    UpdatedById = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_cancellations", x => x.Id);
                    table.ForeignKey(
                        name: "FK_cancellations_outlets_outlet_id",
                        column: x => x.outlet_id,
                        principalTable: "outlets",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_cancellations_users_CreatedById",
                        column: x => x.CreatedById,
                        principalTable: "users",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_cancellations_users_UpdatedById",
                        column: x => x.UpdatedById,
                        principalTable: "users",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_cancellations_users_approved_by_id",
                        column: x => x.approved_by_id,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "deliveries",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    delivery_no = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    delivery_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    outlet_id = table.Column<Guid>(type: "uuid", nullable: false),
                    status = table.Column<string>(type: "text", nullable: false),
                    total_items = table.Column<int>(type: "integer", nullable: false),
                    total_value = table.Column<decimal>(type: "numeric(18,4)", nullable: false),
                    notes = table.Column<string>(type: "text", nullable: true),
                    approved_by_id = table.Column<Guid>(type: "uuid", nullable: true),
                    approved_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()"),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()"),
                    CreatedById = table.Column<Guid>(type: "uuid", nullable: true),
                    UpdatedById = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_deliveries", x => x.Id);
                    table.ForeignKey(
                        name: "FK_deliveries_outlets_outlet_id",
                        column: x => x.outlet_id,
                        principalTable: "outlets",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_deliveries_users_CreatedById",
                        column: x => x.CreatedById,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_deliveries_users_UpdatedById",
                        column: x => x.UpdatedById,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_deliveries_users_approved_by_id",
                        column: x => x.approved_by_id,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "delivery_returns",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    return_no = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    return_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    delivery_no = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    delivered_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    outlet_id = table.Column<Guid>(type: "uuid", nullable: false),
                    reason = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    total_items = table.Column<int>(type: "integer", nullable: false),
                    status = table.Column<string>(type: "text", nullable: false),
                    approved_by_id = table.Column<Guid>(type: "uuid", nullable: true),
                    approved_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()"),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()"),
                    CreatedById = table.Column<Guid>(type: "uuid", nullable: true),
                    UpdatedById = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_delivery_returns", x => x.Id);
                    table.ForeignKey(
                        name: "FK_delivery_returns_outlets_outlet_id",
                        column: x => x.outlet_id,
                        principalTable: "outlets",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_delivery_returns_users_CreatedById",
                        column: x => x.CreatedById,
                        principalTable: "users",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_delivery_returns_users_UpdatedById",
                        column: x => x.UpdatedById,
                        principalTable: "users",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_delivery_returns_users_approved_by_id",
                        column: x => x.approved_by_id,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "disposals",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    disposal_no = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    disposal_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    outlet_id = table.Column<Guid>(type: "uuid", nullable: false),
                    delivered_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    status = table.Column<string>(type: "text", nullable: false),
                    total_items = table.Column<int>(type: "integer", nullable: false),
                    notes = table.Column<string>(type: "text", nullable: true),
                    approved_by_id = table.Column<Guid>(type: "uuid", nullable: true),
                    approved_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()"),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()"),
                    CreatedById = table.Column<Guid>(type: "uuid", nullable: true),
                    UpdatedById = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_disposals", x => x.Id);
                    table.ForeignKey(
                        name: "FK_disposals_outlets_outlet_id",
                        column: x => x.outlet_id,
                        principalTable: "outlets",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_disposals_users_CreatedById",
                        column: x => x.CreatedById,
                        principalTable: "users",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_disposals_users_UpdatedById",
                        column: x => x.UpdatedById,
                        principalTable: "users",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_disposals_users_approved_by_id",
                        column: x => x.approved_by_id,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "outlet_employees",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    outlet_id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    employee_code = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    first_name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    last_name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    full_name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    email = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    phone = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    position = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    hire_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    termination_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    is_manager = table.Column<bool>(type: "boolean", nullable: false),
                    can_receive_deliveries = table.Column<bool>(type: "boolean", nullable: false),
                    notes = table.Column<string>(type: "text", nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedById = table.Column<Guid>(type: "uuid", nullable: true),
                    UpdatedById = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_outlet_employees", x => x.Id);
                    table.ForeignKey(
                        name: "FK_outlet_employees_outlets_outlet_id",
                        column: x => x.outlet_id,
                        principalTable: "outlets",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_outlet_employees_users_CreatedById",
                        column: x => x.CreatedById,
                        principalTable: "users",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_outlet_employees_users_UpdatedById",
                        column: x => x.UpdatedById,
                        principalTable: "users",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_outlet_employees_users_user_id",
                        column: x => x.user_id,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "reconciliations",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ReconciliationNo = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    ReconciliationDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    DeliveryPlanId = table.Column<Guid>(type: "uuid", nullable: false),
                    OutletId = table.Column<Guid>(type: "uuid", nullable: false),
                    Status = table.Column<string>(type: "text", nullable: false),
                    SubmittedBy = table.Column<Guid>(type: "uuid", nullable: true),
                    SubmittedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()"),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_reconciliations", x => x.Id);
                    table.ForeignKey(
                        name: "FK_reconciliations_delivery_plans_DeliveryPlanId",
                        column: x => x.DeliveryPlanId,
                        principalTable: "delivery_plans",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_reconciliations_outlets_OutletId",
                        column: x => x.OutletId,
                        principalTable: "outlets",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "showroom_label_requests",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    outlet_id = table.Column<Guid>(type: "uuid", nullable: false),
                    text_1 = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    text_2 = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    label_count = table.Column<int>(type: "integer", nullable: false),
                    request_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedById = table.Column<Guid>(type: "uuid", nullable: true),
                    UpdatedById = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_showroom_label_requests", x => x.Id);
                    table.ForeignKey(
                        name: "FK_showroom_label_requests_outlets_outlet_id",
                        column: x => x.outlet_id,
                        principalTable: "outlets",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_showroom_label_requests_users_CreatedById",
                        column: x => x.CreatedById,
                        principalTable: "users",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_showroom_label_requests_users_UpdatedById",
                        column: x => x.UpdatedById,
                        principalTable: "users",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "showroom_open_stock",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    outlet_id = table.Column<Guid>(type: "uuid", nullable: false),
                    stock_as_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()"),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()"),
                    CreatedById = table.Column<Guid>(type: "uuid", nullable: true),
                    UpdatedById = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_showroom_open_stock", x => x.Id);
                    table.ForeignKey(
                        name: "FK_showroom_open_stock_outlets_outlet_id",
                        column: x => x.outlet_id,
                        principalTable: "outlets",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_showroom_open_stock_users_CreatedById",
                        column: x => x.CreatedById,
                        principalTable: "users",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_showroom_open_stock_users_UpdatedById",
                        column: x => x.UpdatedById,
                        principalTable: "users",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "transfers",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    transfer_no = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    transfer_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    from_outlet_id = table.Column<Guid>(type: "uuid", nullable: false),
                    to_outlet_id = table.Column<Guid>(type: "uuid", nullable: false),
                    status = table.Column<string>(type: "text", nullable: false),
                    total_items = table.Column<int>(type: "integer", nullable: false),
                    notes = table.Column<string>(type: "text", nullable: true),
                    approved_by_id = table.Column<Guid>(type: "uuid", nullable: true),
                    approved_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()"),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()"),
                    CreatedById = table.Column<Guid>(type: "uuid", nullable: true),
                    UpdatedById = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_transfers", x => x.Id);
                    table.ForeignKey(
                        name: "FK_transfers_outlets_from_outlet_id",
                        column: x => x.from_outlet_id,
                        principalTable: "outlets",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_transfers_outlets_to_outlet_id",
                        column: x => x.to_outlet_id,
                        principalTable: "outlets",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_transfers_users_CreatedById",
                        column: x => x.CreatedById,
                        principalTable: "users",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_transfers_users_UpdatedById",
                        column: x => x.UpdatedById,
                        principalTable: "users",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_transfers_users_approved_by_id",
                        column: x => x.approved_by_id,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "section_consumables",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    production_section_id = table.Column<Guid>(type: "uuid", nullable: false),
                    ingredient_id = table.Column<Guid>(type: "uuid", nullable: false),
                    default_quantity = table.Column<decimal>(type: "numeric(18,3)", nullable: false),
                    is_calculated = table.Column<bool>(type: "boolean", nullable: false),
                    calculation_formula = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    sort_order = table.Column<int>(type: "integer", nullable: false),
                    notes = table.Column<string>(type: "text", nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedById = table.Column<Guid>(type: "uuid", nullable: true),
                    UpdatedById = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_section_consumables", x => x.Id);
                    table.ForeignKey(
                        name: "FK_section_consumables_ingredients_ingredient_id",
                        column: x => x.ingredient_id,
                        principalTable: "ingredients",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_section_consumables_production_sections_production_section_~",
                        column: x => x.production_section_id,
                        principalTable: "production_sections",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_section_consumables_users_CreatedById",
                        column: x => x.CreatedById,
                        principalTable: "users",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_section_consumables_users_UpdatedById",
                        column: x => x.UpdatedById,
                        principalTable: "users",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "daily_production_plans",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    plan_no = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    plan_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    product_id = table.Column<Guid>(type: "uuid", nullable: false),
                    planned_qty = table.Column<decimal>(type: "numeric(18,4)", nullable: false),
                    priority = table.Column<string>(type: "text", nullable: false),
                    status = table.Column<string>(type: "text", nullable: false),
                    reference = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    comment = table.Column<string>(type: "text", nullable: true),
                    notes = table.Column<string>(type: "text", nullable: true),
                    approved_by_id = table.Column<Guid>(type: "uuid", nullable: true),
                    approved_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()"),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()"),
                    CreatedById = table.Column<Guid>(type: "uuid", nullable: true),
                    UpdatedById = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_daily_production_plans", x => x.Id);
                    table.ForeignKey(
                        name: "FK_daily_production_plans_products_product_id",
                        column: x => x.product_id,
                        principalTable: "products",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_daily_production_plans_users_CreatedById",
                        column: x => x.CreatedById,
                        principalTable: "users",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_daily_production_plans_users_UpdatedById",
                        column: x => x.UpdatedById,
                        principalTable: "users",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_daily_production_plans_users_approved_by_id",
                        column: x => x.approved_by_id,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "daily_productions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    production_no = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    production_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    product_id = table.Column<Guid>(type: "uuid", nullable: false),
                    planned_qty = table.Column<decimal>(type: "numeric(18,4)", nullable: false),
                    produced_qty = table.Column<decimal>(type: "numeric(18,4)", nullable: false),
                    shift_id = table.Column<Guid>(type: "uuid", nullable: false),
                    status = table.Column<string>(type: "text", nullable: false),
                    notes = table.Column<string>(type: "text", nullable: true),
                    approved_by_id = table.Column<Guid>(type: "uuid", nullable: true),
                    approved_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()"),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()"),
                    CreatedById = table.Column<Guid>(type: "uuid", nullable: true),
                    UpdatedById = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_daily_productions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_daily_productions_products_product_id",
                        column: x => x.product_id,
                        principalTable: "products",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_daily_productions_shifts_shift_id",
                        column: x => x.shift_id,
                        principalTable: "shifts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_daily_productions_users_CreatedById",
                        column: x => x.CreatedById,
                        principalTable: "users",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_daily_productions_users_UpdatedById",
                        column: x => x.UpdatedById,
                        principalTable: "users",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_daily_productions_users_approved_by_id",
                        column: x => x.approved_by_id,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "default_quantities",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    outlet_id = table.Column<Guid>(type: "uuid", nullable: false),
                    day_type_id = table.Column<Guid>(type: "uuid", nullable: false),
                    product_id = table.Column<Guid>(type: "uuid", nullable: false),
                    full_quantity = table.Column<decimal>(type: "numeric(18,4)", nullable: false),
                    mini_quantity = table.Column<decimal>(type: "numeric(18,4)", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()"),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()"),
                    CreatedById = table.Column<Guid>(type: "uuid", nullable: true),
                    UpdatedById = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_default_quantities", x => x.Id);
                    table.ForeignKey(
                        name: "FK_default_quantities_day_types_day_type_id",
                        column: x => x.day_type_id,
                        principalTable: "day_types",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_default_quantities_outlets_outlet_id",
                        column: x => x.outlet_id,
                        principalTable: "outlets",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_default_quantities_products_product_id",
                        column: x => x.product_id,
                        principalTable: "products",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_default_quantities_users_CreatedById",
                        column: x => x.CreatedById,
                        principalTable: "users",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_default_quantities_users_UpdatedById",
                        column: x => x.UpdatedById,
                        principalTable: "users",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "delivery_plan_items",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    delivery_plan_id = table.Column<Guid>(type: "uuid", nullable: false),
                    product_id = table.Column<Guid>(type: "uuid", nullable: false),
                    outlet_id = table.Column<Guid>(type: "uuid", nullable: false),
                    full_quantity = table.Column<decimal>(type: "numeric(18,4)", nullable: false),
                    mini_quantity = table.Column<decimal>(type: "numeric(18,4)", nullable: false),
                    notes = table.Column<string>(type: "text", nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()"),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()"),
                    CreatedById = table.Column<Guid>(type: "uuid", nullable: true),
                    UpdatedById = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_delivery_plan_items", x => x.Id);
                    table.ForeignKey(
                        name: "FK_delivery_plan_items_delivery_plans_delivery_plan_id",
                        column: x => x.delivery_plan_id,
                        principalTable: "delivery_plans",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_delivery_plan_items_outlets_outlet_id",
                        column: x => x.outlet_id,
                        principalTable: "outlets",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_delivery_plan_items_products_product_id",
                        column: x => x.product_id,
                        principalTable: "products",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_delivery_plan_items_users_CreatedById",
                        column: x => x.CreatedById,
                        principalTable: "users",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_delivery_plan_items_users_UpdatedById",
                        column: x => x.UpdatedById,
                        principalTable: "users",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "freezer_stocks",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    product_id = table.Column<Guid>(type: "uuid", nullable: false),
                    production_section_id = table.Column<Guid>(type: "uuid", nullable: false),
                    current_stock = table.Column<decimal>(type: "numeric(18,4)", nullable: false),
                    last_updated_by = table.Column<Guid>(type: "uuid", nullable: false),
                    last_updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()"),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()"),
                    CreatedById = table.Column<Guid>(type: "uuid", nullable: true),
                    UpdatedById = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_freezer_stocks", x => x.Id);
                    table.ForeignKey(
                        name: "FK_freezer_stocks_production_sections_production_section_id",
                        column: x => x.production_section_id,
                        principalTable: "production_sections",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_freezer_stocks_products_product_id",
                        column: x => x.product_id,
                        principalTable: "products",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_freezer_stocks_users_CreatedById",
                        column: x => x.CreatedById,
                        principalTable: "users",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_freezer_stocks_users_UpdatedById",
                        column: x => x.UpdatedById,
                        principalTable: "users",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_freezer_stocks_users_last_updated_by",
                        column: x => x.last_updated_by,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "immediate_orders",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    order_no = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    order_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    delivery_turn_id = table.Column<Guid>(type: "uuid", nullable: false),
                    outlet_id = table.Column<Guid>(type: "uuid", nullable: false),
                    product_id = table.Column<Guid>(type: "uuid", nullable: false),
                    full_quantity = table.Column<decimal>(type: "numeric(18,4)", nullable: false),
                    mini_quantity = table.Column<decimal>(type: "numeric(18,4)", nullable: false),
                    requested_by = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    reason = table.Column<string>(type: "text", nullable: false),
                    status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    approved_by = table.Column<Guid>(type: "uuid", nullable: true),
                    approved_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    rejection_reason = table.Column<string>(type: "text", nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()"),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()"),
                    CreatedById = table.Column<Guid>(type: "uuid", nullable: true),
                    UpdatedById = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_immediate_orders", x => x.Id);
                    table.ForeignKey(
                        name: "FK_immediate_orders_delivery_turns_delivery_turn_id",
                        column: x => x.delivery_turn_id,
                        principalTable: "delivery_turns",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_immediate_orders_outlets_outlet_id",
                        column: x => x.outlet_id,
                        principalTable: "outlets",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_immediate_orders_products_product_id",
                        column: x => x.product_id,
                        principalTable: "products",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_immediate_orders_users_CreatedById",
                        column: x => x.CreatedById,
                        principalTable: "users",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_immediate_orders_users_UpdatedById",
                        column: x => x.UpdatedById,
                        principalTable: "users",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_immediate_orders_users_approved_by",
                        column: x => x.approved_by,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "label_print_requests",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    display_no = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    date = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    product_id = table.Column<Guid>(type: "uuid", nullable: false),
                    label_count = table.Column<int>(type: "integer", nullable: false),
                    start_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    expiry_days = table.Column<int>(type: "integer", nullable: false),
                    price_override = table.Column<decimal>(type: "numeric(18,4)", nullable: true),
                    status = table.Column<string>(type: "text", nullable: false),
                    approved_by_id = table.Column<Guid>(type: "uuid", nullable: true),
                    approved_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()"),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()"),
                    CreatedById = table.Column<Guid>(type: "uuid", nullable: true),
                    UpdatedById = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_label_print_requests", x => x.Id);
                    table.ForeignKey(
                        name: "FK_label_print_requests_products_product_id",
                        column: x => x.product_id,
                        principalTable: "products",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_label_print_requests_users_CreatedById",
                        column: x => x.CreatedById,
                        principalTable: "users",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_label_print_requests_users_UpdatedById",
                        column: x => x.UpdatedById,
                        principalTable: "users",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_label_print_requests_users_approved_by_id",
                        column: x => x.approved_by_id,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "price_list_items",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    price_list_id = table.Column<Guid>(type: "uuid", nullable: false),
                    product_id = table.Column<Guid>(type: "uuid", nullable: false),
                    unit_price = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    discount_percentage = table.Column<decimal>(type: "numeric(5,2)", nullable: true),
                    min_quantity = table.Column<decimal>(type: "numeric(18,4)", nullable: true),
                    max_quantity = table.Column<decimal>(type: "numeric(18,4)", nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedById = table.Column<Guid>(type: "uuid", nullable: true),
                    UpdatedById = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_price_list_items", x => x.Id);
                    table.ForeignKey(
                        name: "FK_price_list_items_price_lists_price_list_id",
                        column: x => x.price_list_id,
                        principalTable: "price_lists",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_price_list_items_products_product_id",
                        column: x => x.product_id,
                        principalTable: "products",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_price_list_items_users_CreatedById",
                        column: x => x.CreatedById,
                        principalTable: "users",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_price_list_items_users_UpdatedById",
                        column: x => x.UpdatedById,
                        principalTable: "users",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "production_cancels",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    cancel_no = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    cancel_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    production_no = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    product_id = table.Column<Guid>(type: "uuid", nullable: false),
                    cancelled_qty = table.Column<decimal>(type: "numeric(18,4)", nullable: false),
                    reason = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    status = table.Column<string>(type: "text", nullable: false),
                    approved_by_id = table.Column<Guid>(type: "uuid", nullable: true),
                    approved_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()"),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()"),
                    CreatedById = table.Column<Guid>(type: "uuid", nullable: true),
                    UpdatedById = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_production_cancels", x => x.Id);
                    table.ForeignKey(
                        name: "FK_production_cancels_products_product_id",
                        column: x => x.product_id,
                        principalTable: "products",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_production_cancels_users_CreatedById",
                        column: x => x.CreatedById,
                        principalTable: "users",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_production_cancels_users_UpdatedById",
                        column: x => x.UpdatedById,
                        principalTable: "users",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_production_cancels_users_approved_by_id",
                        column: x => x.approved_by_id,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "recipes",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ProductId = table.Column<Guid>(type: "uuid", nullable: false),
                    TemplateId = table.Column<Guid>(type: "uuid", nullable: true),
                    Version = table.Column<int>(type: "integer", nullable: false),
                    EffectiveFrom = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    EffectiveTo = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ApplyRoundOff = table.Column<bool>(type: "boolean", nullable: false),
                    RoundOffValue = table.Column<decimal>(type: "numeric(18,4)", nullable: true),
                    RoundOffNotes = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()"),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()"),
                    CreatedById = table.Column<Guid>(type: "uuid", nullable: true),
                    UpdatedById = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_recipes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_recipes_products_ProductId",
                        column: x => x.ProductId,
                        principalTable: "products",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_recipes_recipe_templates_TemplateId",
                        column: x => x.TemplateId,
                        principalTable: "recipe_templates",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_recipes_users_CreatedById",
                        column: x => x.CreatedById,
                        principalTable: "users",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_recipes_users_UpdatedById",
                        column: x => x.UpdatedById,
                        principalTable: "users",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "stock_adjustments",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    adjustment_no = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    adjustment_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    product_id = table.Column<Guid>(type: "uuid", nullable: false),
                    adjustment_type = table.Column<string>(type: "text", nullable: false),
                    quantity = table.Column<decimal>(type: "numeric(18,4)", nullable: false),
                    reason = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    status = table.Column<string>(type: "text", nullable: false),
                    notes = table.Column<string>(type: "text", nullable: true),
                    approved_by_id = table.Column<Guid>(type: "uuid", nullable: true),
                    approved_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()"),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()"),
                    CreatedById = table.Column<Guid>(type: "uuid", nullable: true),
                    UpdatedById = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_stock_adjustments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_stock_adjustments_products_product_id",
                        column: x => x.product_id,
                        principalTable: "products",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_stock_adjustments_users_CreatedById",
                        column: x => x.CreatedById,
                        principalTable: "users",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_stock_adjustments_users_UpdatedById",
                        column: x => x.UpdatedById,
                        principalTable: "users",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_stock_adjustments_users_approved_by_id",
                        column: x => x.approved_by_id,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "stock_bf",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    bf_no = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    bf_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    outlet_id = table.Column<Guid>(type: "uuid", nullable: false),
                    product_id = table.Column<Guid>(type: "uuid", nullable: false),
                    quantity = table.Column<decimal>(type: "numeric(18,4)", nullable: false),
                    status = table.Column<string>(type: "text", nullable: false),
                    approved_by_id = table.Column<Guid>(type: "uuid", nullable: true),
                    approved_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    rejected_by_id = table.Column<Guid>(type: "uuid", nullable: true),
                    rejected_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()"),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()"),
                    CreatedById = table.Column<Guid>(type: "uuid", nullable: true),
                    UpdatedById = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_stock_bf", x => x.Id);
                    table.ForeignKey(
                        name: "FK_stock_bf_outlets_outlet_id",
                        column: x => x.outlet_id,
                        principalTable: "outlets",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_stock_bf_products_product_id",
                        column: x => x.product_id,
                        principalTable: "products",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_stock_bf_users_CreatedById",
                        column: x => x.CreatedById,
                        principalTable: "users",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_stock_bf_users_UpdatedById",
                        column: x => x.UpdatedById,
                        principalTable: "users",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_stock_bf_users_approved_by_id",
                        column: x => x.approved_by_id,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_stock_bf_users_rejected_by_id",
                        column: x => x.rejected_by_id,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "order_items",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    order_header_id = table.Column<Guid>(type: "uuid", nullable: false),
                    product_id = table.Column<Guid>(type: "uuid", nullable: false),
                    outlet_id = table.Column<Guid>(type: "uuid", nullable: false),
                    delivery_turn_id = table.Column<Guid>(type: "uuid", nullable: false),
                    full_quantity = table.Column<decimal>(type: "numeric(18,4)", nullable: false),
                    mini_quantity = table.Column<decimal>(type: "numeric(18,4)", nullable: false),
                    is_extra = table.Column<bool>(type: "boolean", nullable: false),
                    is_customized = table.Column<bool>(type: "boolean", nullable: false),
                    customization_notes = table.Column<string>(type: "text", nullable: true),
                    notes = table.Column<string>(type: "text", nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()"),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()"),
                    CreatedById = table.Column<Guid>(type: "uuid", nullable: true),
                    UpdatedById = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_order_items", x => x.Id);
                    table.ForeignKey(
                        name: "FK_order_items_delivery_turns_delivery_turn_id",
                        column: x => x.delivery_turn_id,
                        principalTable: "delivery_turns",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_order_items_order_headers_order_header_id",
                        column: x => x.order_header_id,
                        principalTable: "order_headers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_order_items_outlets_outlet_id",
                        column: x => x.outlet_id,
                        principalTable: "outlets",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_order_items_products_product_id",
                        column: x => x.product_id,
                        principalTable: "products",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_order_items_users_CreatedById",
                        column: x => x.CreatedById,
                        principalTable: "users",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_order_items_users_UpdatedById",
                        column: x => x.UpdatedById,
                        principalTable: "users",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "production_plan_items",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ProductionPlanId = table.Column<Guid>(type: "uuid", nullable: false),
                    ProductionSectionId = table.Column<Guid>(type: "uuid", nullable: false),
                    ProductId = table.Column<Guid>(type: "uuid", nullable: false),
                    RegularFullQty = table.Column<decimal>(type: "numeric(18,4)", nullable: false),
                    RegularMiniQty = table.Column<decimal>(type: "numeric(18,4)", nullable: false),
                    CustomizedFullQty = table.Column<decimal>(type: "numeric(18,4)", nullable: false),
                    CustomizedMiniQty = table.Column<decimal>(type: "numeric(18,4)", nullable: false),
                    FreezerStock = table.Column<decimal>(type: "numeric(18,4)", nullable: false),
                    ProduceQty = table.Column<decimal>(type: "numeric(18,4)", nullable: false),
                    IsExcluded = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()"),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_production_plan_items", x => x.Id);
                    table.ForeignKey(
                        name: "FK_production_plan_items_production_plans_ProductionPlanId",
                        column: x => x.ProductionPlanId,
                        principalTable: "production_plans",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_production_plan_items_production_sections_ProductionSection~",
                        column: x => x.ProductionSectionId,
                        principalTable: "production_sections",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_production_plan_items_products_ProductId",
                        column: x => x.ProductId,
                        principalTable: "products",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "stores_issue_notes",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    IssueNoteNo = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    ProductionPlanId = table.Column<Guid>(type: "uuid", nullable: false),
                    ProductionSectionId = table.Column<Guid>(type: "uuid", nullable: false),
                    IssueDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Status = table.Column<string>(type: "text", nullable: false),
                    IssuedBy = table.Column<Guid>(type: "uuid", nullable: true),
                    ReceivedBy = table.Column<Guid>(type: "uuid", nullable: true),
                    ReceivedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()"),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_stores_issue_notes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_stores_issue_notes_production_plans_ProductionPlanId",
                        column: x => x.ProductionPlanId,
                        principalTable: "production_plans",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_stores_issue_notes_production_sections_ProductionSectionId",
                        column: x => x.ProductionSectionId,
                        principalTable: "production_sections",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "delivery_items",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    delivery_id = table.Column<Guid>(type: "uuid", nullable: false),
                    product_id = table.Column<Guid>(type: "uuid", nullable: false),
                    quantity = table.Column<decimal>(type: "numeric(18,4)", nullable: false),
                    unit_price = table.Column<decimal>(type: "numeric(18,4)", nullable: false),
                    total = table.Column<decimal>(type: "numeric(18,4)", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()"),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()"),
                    CreatedById = table.Column<Guid>(type: "uuid", nullable: true),
                    UpdatedById = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_delivery_items", x => x.Id);
                    table.ForeignKey(
                        name: "FK_delivery_items_deliveries_delivery_id",
                        column: x => x.delivery_id,
                        principalTable: "deliveries",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_delivery_items_products_product_id",
                        column: x => x.product_id,
                        principalTable: "products",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_delivery_items_users_CreatedById",
                        column: x => x.CreatedById,
                        principalTable: "users",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_delivery_items_users_UpdatedById",
                        column: x => x.UpdatedById,
                        principalTable: "users",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "delivery_return_items",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    delivery_return_id = table.Column<Guid>(type: "uuid", nullable: false),
                    product_id = table.Column<Guid>(type: "uuid", nullable: false),
                    quantity = table.Column<decimal>(type: "numeric(18,4)", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()"),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()"),
                    CreatedById = table.Column<Guid>(type: "uuid", nullable: true),
                    UpdatedById = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_delivery_return_items", x => x.Id);
                    table.ForeignKey(
                        name: "FK_delivery_return_items_delivery_returns_delivery_return_id",
                        column: x => x.delivery_return_id,
                        principalTable: "delivery_returns",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_delivery_return_items_products_product_id",
                        column: x => x.product_id,
                        principalTable: "products",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_delivery_return_items_users_CreatedById",
                        column: x => x.CreatedById,
                        principalTable: "users",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_delivery_return_items_users_UpdatedById",
                        column: x => x.UpdatedById,
                        principalTable: "users",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "disposal_items",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    disposal_id = table.Column<Guid>(type: "uuid", nullable: false),
                    product_id = table.Column<Guid>(type: "uuid", nullable: false),
                    quantity = table.Column<decimal>(type: "numeric(18,4)", nullable: false),
                    reason = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()"),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()"),
                    CreatedById = table.Column<Guid>(type: "uuid", nullable: true),
                    UpdatedById = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_disposal_items", x => x.Id);
                    table.ForeignKey(
                        name: "FK_disposal_items_disposals_disposal_id",
                        column: x => x.disposal_id,
                        principalTable: "disposals",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_disposal_items_products_product_id",
                        column: x => x.product_id,
                        principalTable: "products",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_disposal_items_users_CreatedById",
                        column: x => x.CreatedById,
                        principalTable: "users",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_disposal_items_users_UpdatedById",
                        column: x => x.UpdatedById,
                        principalTable: "users",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "reconciliation_items",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ReconciliationId = table.Column<Guid>(type: "uuid", nullable: false),
                    ProductId = table.Column<Guid>(type: "uuid", nullable: false),
                    ExpectedQty = table.Column<decimal>(type: "numeric(18,4)", nullable: false),
                    ActualQty = table.Column<decimal>(type: "numeric(18,4)", nullable: false),
                    VarianceQty = table.Column<decimal>(type: "numeric(18,4)", nullable: false),
                    VarianceType = table.Column<string>(type: "text", nullable: false),
                    Reason = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()"),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_reconciliation_items", x => x.Id);
                    table.ForeignKey(
                        name: "FK_reconciliation_items_products_ProductId",
                        column: x => x.ProductId,
                        principalTable: "products",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_reconciliation_items_reconciliations_ReconciliationId",
                        column: x => x.ReconciliationId,
                        principalTable: "reconciliations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "transfer_items",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    transfer_id = table.Column<Guid>(type: "uuid", nullable: false),
                    product_id = table.Column<Guid>(type: "uuid", nullable: false),
                    quantity = table.Column<decimal>(type: "numeric(18,4)", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()"),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()"),
                    CreatedById = table.Column<Guid>(type: "uuid", nullable: true),
                    UpdatedById = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_transfer_items", x => x.Id);
                    table.ForeignKey(
                        name: "FK_transfer_items_products_product_id",
                        column: x => x.product_id,
                        principalTable: "products",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_transfer_items_transfers_transfer_id",
                        column: x => x.transfer_id,
                        principalTable: "transfers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_transfer_items_users_CreatedById",
                        column: x => x.CreatedById,
                        principalTable: "users",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_transfer_items_users_UpdatedById",
                        column: x => x.UpdatedById,
                        principalTable: "users",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "freezer_stock_history",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    freezer_stock_id = table.Column<Guid>(type: "uuid", nullable: false),
                    transaction_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    transaction_type = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    quantity = table.Column<decimal>(type: "numeric(18,4)", nullable: false),
                    previous_stock = table.Column<decimal>(type: "numeric(18,4)", nullable: false),
                    new_stock = table.Column<decimal>(type: "numeric(18,4)", nullable: false),
                    reason = table.Column<string>(type: "text", nullable: false),
                    reference_no = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()"),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()"),
                    CreatedById = table.Column<Guid>(type: "uuid", nullable: true),
                    UpdatedById = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_freezer_stock_history", x => x.Id);
                    table.ForeignKey(
                        name: "FK_freezer_stock_history_freezer_stocks_freezer_stock_id",
                        column: x => x.freezer_stock_id,
                        principalTable: "freezer_stocks",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_freezer_stock_history_users_CreatedById",
                        column: x => x.CreatedById,
                        principalTable: "users",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_freezer_stock_history_users_UpdatedById",
                        column: x => x.UpdatedById,
                        principalTable: "users",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "recipe_components",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    RecipeId = table.Column<Guid>(type: "uuid", nullable: false),
                    ProductionSectionId = table.Column<Guid>(type: "uuid", nullable: false),
                    ComponentName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    SortOrder = table.Column<int>(type: "integer", nullable: false),
                    IsPercentageBased = table.Column<bool>(type: "boolean", nullable: false),
                    BaseRecipeId = table.Column<Guid>(type: "uuid", nullable: true),
                    PercentageOfBase = table.Column<decimal>(type: "numeric(18,4)", nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()"),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()"),
                    CreatedById = table.Column<Guid>(type: "uuid", nullable: true),
                    UpdatedById = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_recipe_components", x => x.Id);
                    table.ForeignKey(
                        name: "FK_recipe_components_production_sections_ProductionSectionId",
                        column: x => x.ProductionSectionId,
                        principalTable: "production_sections",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_recipe_components_recipes_BaseRecipeId",
                        column: x => x.BaseRecipeId,
                        principalTable: "recipes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_recipe_components_recipes_RecipeId",
                        column: x => x.RecipeId,
                        principalTable: "recipes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_recipe_components_users_CreatedById",
                        column: x => x.CreatedById,
                        principalTable: "users",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_recipe_components_users_UpdatedById",
                        column: x => x.UpdatedById,
                        principalTable: "users",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "production_adjustments",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ProductionPlanItemId = table.Column<Guid>(type: "uuid", nullable: false),
                    AdjustmentQty = table.Column<decimal>(type: "numeric(18,4)", nullable: false),
                    Reason = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    AdjustedBy = table.Column<Guid>(type: "uuid", nullable: false),
                    AdjustedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_production_adjustments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_production_adjustments_production_plan_items_ProductionPlan~",
                        column: x => x.ProductionPlanItemId,
                        principalTable: "production_plan_items",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "stores_issue_note_items",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    StoresIssueNoteId = table.Column<Guid>(type: "uuid", nullable: false),
                    IngredientId = table.Column<Guid>(type: "uuid", nullable: false),
                    ProductionQty = table.Column<decimal>(type: "numeric(18,4)", nullable: false),
                    ExtraQty = table.Column<decimal>(type: "numeric(18,4)", nullable: false),
                    TotalQty = table.Column<decimal>(type: "numeric(18,4)", nullable: false),
                    Notes = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()"),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_stores_issue_note_items", x => x.Id);
                    table.ForeignKey(
                        name: "FK_stores_issue_note_items_ingredients_IngredientId",
                        column: x => x.IngredientId,
                        principalTable: "ingredients",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_stores_issue_note_items_stores_issue_notes_StoresIssueNoteId",
                        column: x => x.StoresIssueNoteId,
                        principalTable: "stores_issue_notes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "recipe_ingredients",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    RecipeComponentId = table.Column<Guid>(type: "uuid", nullable: false),
                    IngredientId = table.Column<Guid>(type: "uuid", nullable: false),
                    QtyPerUnit = table.Column<decimal>(type: "numeric(18,4)", nullable: false),
                    ExtraQtyPerUnit = table.Column<decimal>(type: "numeric(18,4)", nullable: false),
                    StoresOnly = table.Column<bool>(type: "boolean", nullable: false),
                    ShowExtraInStores = table.Column<bool>(type: "boolean", nullable: false),
                    IsPercentage = table.Column<bool>(type: "boolean", nullable: false),
                    PercentageSourceProductId = table.Column<Guid>(type: "uuid", nullable: true),
                    PercentageValue = table.Column<decimal>(type: "numeric(18,4)", nullable: true),
                    SortOrder = table.Column<int>(type: "integer", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()"),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()"),
                    CreatedById = table.Column<Guid>(type: "uuid", nullable: true),
                    UpdatedById = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_recipe_ingredients", x => x.Id);
                    table.ForeignKey(
                        name: "FK_recipe_ingredients_ingredients_IngredientId",
                        column: x => x.IngredientId,
                        principalTable: "ingredients",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_recipe_ingredients_recipe_components_RecipeComponentId",
                        column: x => x.RecipeComponentId,
                        principalTable: "recipe_components",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_recipe_ingredients_users_CreatedById",
                        column: x => x.CreatedById,
                        principalTable: "users",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_recipe_ingredients_users_UpdatedById",
                        column: x => x.UpdatedById,
                        principalTable: "users",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateIndex(
                name: "IX_api_request_logs_Endpoint",
                table: "api_request_logs",
                column: "Endpoint");

            migrationBuilder.CreateIndex(
                name: "IX_api_request_logs_RequestId",
                table: "api_request_logs",
                column: "RequestId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_api_request_logs_ResponseStatusCode",
                table: "api_request_logs",
                column: "ResponseStatusCode");

            migrationBuilder.CreateIndex(
                name: "IX_api_request_logs_Timestamp",
                table: "api_request_logs",
                column: "Timestamp");

            migrationBuilder.CreateIndex(
                name: "IX_api_request_logs_UserId",
                table: "api_request_logs",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_approval_queue_approved_by_id",
                table: "approval_queue",
                column: "approved_by_id");

            migrationBuilder.CreateIndex(
                name: "IX_approval_queue_CreatedById",
                table: "approval_queue",
                column: "CreatedById");

            migrationBuilder.CreateIndex(
                name: "IX_approval_queue_requested_by_id",
                table: "approval_queue",
                column: "requested_by_id");

            migrationBuilder.CreateIndex(
                name: "IX_approval_queue_UpdatedById",
                table: "approval_queue",
                column: "UpdatedById");

            migrationBuilder.CreateIndex(
                name: "IX_audit_logs_Action",
                table: "audit_logs",
                column: "Action");

            migrationBuilder.CreateIndex(
                name: "IX_audit_logs_EntityId",
                table: "audit_logs",
                column: "EntityId");

            migrationBuilder.CreateIndex(
                name: "IX_audit_logs_EntityType",
                table: "audit_logs",
                column: "EntityType");

            migrationBuilder.CreateIndex(
                name: "IX_audit_logs_EventType",
                table: "audit_logs",
                column: "EventType");

            migrationBuilder.CreateIndex(
                name: "IX_audit_logs_Timestamp",
                table: "audit_logs",
                column: "Timestamp");

            migrationBuilder.CreateIndex(
                name: "IX_audit_logs_UserId",
                table: "audit_logs",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_authentication_logs_Email",
                table: "authentication_logs",
                column: "Email");

            migrationBuilder.CreateIndex(
                name: "IX_authentication_logs_EventType",
                table: "authentication_logs",
                column: "EventType");

            migrationBuilder.CreateIndex(
                name: "IX_authentication_logs_IpAddress",
                table: "authentication_logs",
                column: "IpAddress");

            migrationBuilder.CreateIndex(
                name: "IX_authentication_logs_Timestamp",
                table: "authentication_logs",
                column: "Timestamp");

            migrationBuilder.CreateIndex(
                name: "IX_authentication_logs_UserId",
                table: "authentication_logs",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_cancellations_approved_by_id",
                table: "cancellations",
                column: "approved_by_id");

            migrationBuilder.CreateIndex(
                name: "IX_cancellations_cancellation_date",
                table: "cancellations",
                column: "cancellation_date");

            migrationBuilder.CreateIndex(
                name: "IX_cancellations_cancellation_no",
                table: "cancellations",
                column: "cancellation_no",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_cancellations_CreatedById",
                table: "cancellations",
                column: "CreatedById");

            migrationBuilder.CreateIndex(
                name: "IX_cancellations_outlet_id",
                table: "cancellations",
                column: "outlet_id");

            migrationBuilder.CreateIndex(
                name: "IX_cancellations_status",
                table: "cancellations",
                column: "status");

            migrationBuilder.CreateIndex(
                name: "IX_cancellations_UpdatedById",
                table: "cancellations",
                column: "UpdatedById");

            migrationBuilder.CreateIndex(
                name: "IX_categories_Code",
                table: "categories",
                column: "Code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_categories_CreatedById",
                table: "categories",
                column: "CreatedById");

            migrationBuilder.CreateIndex(
                name: "IX_categories_IsActive",
                table: "categories",
                column: "IsActive");

            migrationBuilder.CreateIndex(
                name: "IX_categories_UpdatedById",
                table: "categories",
                column: "UpdatedById");

            migrationBuilder.CreateIndex(
                name: "IX_daily_production_plans_approved_by_id",
                table: "daily_production_plans",
                column: "approved_by_id");

            migrationBuilder.CreateIndex(
                name: "IX_daily_production_plans_CreatedById",
                table: "daily_production_plans",
                column: "CreatedById");

            migrationBuilder.CreateIndex(
                name: "IX_daily_production_plans_plan_date",
                table: "daily_production_plans",
                column: "plan_date");

            migrationBuilder.CreateIndex(
                name: "IX_daily_production_plans_plan_no",
                table: "daily_production_plans",
                column: "plan_no",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_daily_production_plans_product_id",
                table: "daily_production_plans",
                column: "product_id");

            migrationBuilder.CreateIndex(
                name: "IX_daily_production_plans_status",
                table: "daily_production_plans",
                column: "status");

            migrationBuilder.CreateIndex(
                name: "IX_daily_production_plans_UpdatedById",
                table: "daily_production_plans",
                column: "UpdatedById");

            migrationBuilder.CreateIndex(
                name: "IX_daily_productions_approved_by_id",
                table: "daily_productions",
                column: "approved_by_id");

            migrationBuilder.CreateIndex(
                name: "IX_daily_productions_CreatedById",
                table: "daily_productions",
                column: "CreatedById");

            migrationBuilder.CreateIndex(
                name: "IX_daily_productions_product_id",
                table: "daily_productions",
                column: "product_id");

            migrationBuilder.CreateIndex(
                name: "IX_daily_productions_production_date",
                table: "daily_productions",
                column: "production_date");

            migrationBuilder.CreateIndex(
                name: "IX_daily_productions_production_no",
                table: "daily_productions",
                column: "production_no",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_daily_productions_shift_id",
                table: "daily_productions",
                column: "shift_id");

            migrationBuilder.CreateIndex(
                name: "IX_daily_productions_status",
                table: "daily_productions",
                column: "status");

            migrationBuilder.CreateIndex(
                name: "IX_daily_productions_UpdatedById",
                table: "daily_productions",
                column: "UpdatedById");

            migrationBuilder.CreateIndex(
                name: "IX_day_locks_IsLocked",
                table: "day_locks",
                column: "IsLocked");

            migrationBuilder.CreateIndex(
                name: "IX_day_locks_LockDate",
                table: "day_locks",
                column: "LockDate",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_day_locks_LockedBy",
                table: "day_locks",
                column: "LockedBy");

            migrationBuilder.CreateIndex(
                name: "IX_day_types_CreatedById",
                table: "day_types",
                column: "CreatedById");

            migrationBuilder.CreateIndex(
                name: "IX_day_types_UpdatedById",
                table: "day_types",
                column: "UpdatedById");

            migrationBuilder.CreateIndex(
                name: "IX_default_quantities_CreatedById",
                table: "default_quantities",
                column: "CreatedById");

            migrationBuilder.CreateIndex(
                name: "IX_default_quantities_day_type_id",
                table: "default_quantities",
                column: "day_type_id");

            migrationBuilder.CreateIndex(
                name: "IX_default_quantities_IsActive",
                table: "default_quantities",
                column: "IsActive");

            migrationBuilder.CreateIndex(
                name: "IX_default_quantities_outlet_id_day_type_id_product_id",
                table: "default_quantities",
                columns: new[] { "outlet_id", "day_type_id", "product_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_default_quantities_product_id",
                table: "default_quantities",
                column: "product_id");

            migrationBuilder.CreateIndex(
                name: "IX_default_quantities_UpdatedById",
                table: "default_quantities",
                column: "UpdatedById");

            migrationBuilder.CreateIndex(
                name: "IX_deliveries_approved_by_id",
                table: "deliveries",
                column: "approved_by_id");

            migrationBuilder.CreateIndex(
                name: "IX_deliveries_CreatedById",
                table: "deliveries",
                column: "CreatedById");

            migrationBuilder.CreateIndex(
                name: "IX_deliveries_delivery_date",
                table: "deliveries",
                column: "delivery_date");

            migrationBuilder.CreateIndex(
                name: "IX_deliveries_delivery_no",
                table: "deliveries",
                column: "delivery_no",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_deliveries_outlet_id",
                table: "deliveries",
                column: "outlet_id");

            migrationBuilder.CreateIndex(
                name: "IX_deliveries_status",
                table: "deliveries",
                column: "status");

            migrationBuilder.CreateIndex(
                name: "IX_deliveries_UpdatedById",
                table: "deliveries",
                column: "UpdatedById");

            migrationBuilder.CreateIndex(
                name: "IX_delivery_items_CreatedById",
                table: "delivery_items",
                column: "CreatedById");

            migrationBuilder.CreateIndex(
                name: "IX_delivery_items_delivery_id",
                table: "delivery_items",
                column: "delivery_id");

            migrationBuilder.CreateIndex(
                name: "IX_delivery_items_product_id",
                table: "delivery_items",
                column: "product_id");

            migrationBuilder.CreateIndex(
                name: "IX_delivery_items_UpdatedById",
                table: "delivery_items",
                column: "UpdatedById");

            migrationBuilder.CreateIndex(
                name: "IX_delivery_plan_items_CreatedById",
                table: "delivery_plan_items",
                column: "CreatedById");

            migrationBuilder.CreateIndex(
                name: "IX_delivery_plan_items_delivery_plan_id_product_id_outlet_id",
                table: "delivery_plan_items",
                columns: new[] { "delivery_plan_id", "product_id", "outlet_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_delivery_plan_items_IsActive",
                table: "delivery_plan_items",
                column: "IsActive");

            migrationBuilder.CreateIndex(
                name: "IX_delivery_plan_items_outlet_id",
                table: "delivery_plan_items",
                column: "outlet_id");

            migrationBuilder.CreateIndex(
                name: "IX_delivery_plan_items_product_id",
                table: "delivery_plan_items",
                column: "product_id");

            migrationBuilder.CreateIndex(
                name: "IX_delivery_plan_items_UpdatedById",
                table: "delivery_plan_items",
                column: "UpdatedById");

            migrationBuilder.CreateIndex(
                name: "IX_delivery_plans_CreatedById",
                table: "delivery_plans",
                column: "CreatedById");

            migrationBuilder.CreateIndex(
                name: "IX_delivery_plans_day_type_id",
                table: "delivery_plans",
                column: "day_type_id");

            migrationBuilder.CreateIndex(
                name: "IX_delivery_plans_delivery_turn_id",
                table: "delivery_plans",
                column: "delivery_turn_id");

            migrationBuilder.CreateIndex(
                name: "IX_delivery_plans_IsActive",
                table: "delivery_plans",
                column: "IsActive");

            migrationBuilder.CreateIndex(
                name: "IX_delivery_plans_plan_date",
                table: "delivery_plans",
                column: "plan_date");

            migrationBuilder.CreateIndex(
                name: "IX_delivery_plans_plan_no",
                table: "delivery_plans",
                column: "plan_no",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_delivery_plans_status",
                table: "delivery_plans",
                column: "status");

            migrationBuilder.CreateIndex(
                name: "IX_delivery_plans_UpdatedById",
                table: "delivery_plans",
                column: "UpdatedById");

            migrationBuilder.CreateIndex(
                name: "IX_delivery_return_items_CreatedById",
                table: "delivery_return_items",
                column: "CreatedById");

            migrationBuilder.CreateIndex(
                name: "IX_delivery_return_items_delivery_return_id",
                table: "delivery_return_items",
                column: "delivery_return_id");

            migrationBuilder.CreateIndex(
                name: "IX_delivery_return_items_product_id",
                table: "delivery_return_items",
                column: "product_id");

            migrationBuilder.CreateIndex(
                name: "IX_delivery_return_items_UpdatedById",
                table: "delivery_return_items",
                column: "UpdatedById");

            migrationBuilder.CreateIndex(
                name: "IX_delivery_returns_approved_by_id",
                table: "delivery_returns",
                column: "approved_by_id");

            migrationBuilder.CreateIndex(
                name: "IX_delivery_returns_CreatedById",
                table: "delivery_returns",
                column: "CreatedById");

            migrationBuilder.CreateIndex(
                name: "IX_delivery_returns_outlet_id",
                table: "delivery_returns",
                column: "outlet_id");

            migrationBuilder.CreateIndex(
                name: "IX_delivery_returns_return_date",
                table: "delivery_returns",
                column: "return_date");

            migrationBuilder.CreateIndex(
                name: "IX_delivery_returns_return_no",
                table: "delivery_returns",
                column: "return_no",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_delivery_returns_status",
                table: "delivery_returns",
                column: "status");

            migrationBuilder.CreateIndex(
                name: "IX_delivery_returns_UpdatedById",
                table: "delivery_returns",
                column: "UpdatedById");

            migrationBuilder.CreateIndex(
                name: "IX_delivery_turns_CreatedById",
                table: "delivery_turns",
                column: "CreatedById");

            migrationBuilder.CreateIndex(
                name: "IX_delivery_turns_UpdatedById",
                table: "delivery_turns",
                column: "UpdatedById");

            migrationBuilder.CreateIndex(
                name: "IX_disposal_items_CreatedById",
                table: "disposal_items",
                column: "CreatedById");

            migrationBuilder.CreateIndex(
                name: "IX_disposal_items_disposal_id",
                table: "disposal_items",
                column: "disposal_id");

            migrationBuilder.CreateIndex(
                name: "IX_disposal_items_product_id",
                table: "disposal_items",
                column: "product_id");

            migrationBuilder.CreateIndex(
                name: "IX_disposal_items_UpdatedById",
                table: "disposal_items",
                column: "UpdatedById");

            migrationBuilder.CreateIndex(
                name: "IX_disposals_approved_by_id",
                table: "disposals",
                column: "approved_by_id");

            migrationBuilder.CreateIndex(
                name: "IX_disposals_CreatedById",
                table: "disposals",
                column: "CreatedById");

            migrationBuilder.CreateIndex(
                name: "IX_disposals_disposal_date",
                table: "disposals",
                column: "disposal_date");

            migrationBuilder.CreateIndex(
                name: "IX_disposals_disposal_no",
                table: "disposals",
                column: "disposal_no",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_disposals_outlet_id",
                table: "disposals",
                column: "outlet_id");

            migrationBuilder.CreateIndex(
                name: "IX_disposals_status",
                table: "disposals",
                column: "status");

            migrationBuilder.CreateIndex(
                name: "IX_disposals_UpdatedById",
                table: "disposals",
                column: "UpdatedById");

            migrationBuilder.CreateIndex(
                name: "IX_freezer_stock_history_CreatedById",
                table: "freezer_stock_history",
                column: "CreatedById");

            migrationBuilder.CreateIndex(
                name: "IX_freezer_stock_history_freezer_stock_id",
                table: "freezer_stock_history",
                column: "freezer_stock_id");

            migrationBuilder.CreateIndex(
                name: "IX_freezer_stock_history_IsActive",
                table: "freezer_stock_history",
                column: "IsActive");

            migrationBuilder.CreateIndex(
                name: "IX_freezer_stock_history_transaction_date",
                table: "freezer_stock_history",
                column: "transaction_date");

            migrationBuilder.CreateIndex(
                name: "IX_freezer_stock_history_UpdatedById",
                table: "freezer_stock_history",
                column: "UpdatedById");

            migrationBuilder.CreateIndex(
                name: "IX_freezer_stocks_CreatedById",
                table: "freezer_stocks",
                column: "CreatedById");

            migrationBuilder.CreateIndex(
                name: "IX_freezer_stocks_IsActive",
                table: "freezer_stocks",
                column: "IsActive");

            migrationBuilder.CreateIndex(
                name: "IX_freezer_stocks_last_updated_by",
                table: "freezer_stocks",
                column: "last_updated_by");

            migrationBuilder.CreateIndex(
                name: "IX_freezer_stocks_product_id_production_section_id",
                table: "freezer_stocks",
                columns: new[] { "product_id", "production_section_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_freezer_stocks_production_section_id",
                table: "freezer_stocks",
                column: "production_section_id");

            migrationBuilder.CreateIndex(
                name: "IX_freezer_stocks_UpdatedById",
                table: "freezer_stocks",
                column: "UpdatedById");

            migrationBuilder.CreateIndex(
                name: "IX_grid_configurations_CreatedById",
                table: "grid_configurations",
                column: "CreatedById");

            migrationBuilder.CreateIndex(
                name: "IX_grid_configurations_UpdatedById",
                table: "grid_configurations",
                column: "UpdatedById");

            migrationBuilder.CreateIndex(
                name: "IX_grid_configurations_user_id",
                table: "grid_configurations",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "IX_immediate_orders_approved_by",
                table: "immediate_orders",
                column: "approved_by");

            migrationBuilder.CreateIndex(
                name: "IX_immediate_orders_CreatedById",
                table: "immediate_orders",
                column: "CreatedById");

            migrationBuilder.CreateIndex(
                name: "IX_immediate_orders_delivery_turn_id",
                table: "immediate_orders",
                column: "delivery_turn_id");

            migrationBuilder.CreateIndex(
                name: "IX_immediate_orders_IsActive",
                table: "immediate_orders",
                column: "IsActive");

            migrationBuilder.CreateIndex(
                name: "IX_immediate_orders_order_date_delivery_turn_id_outlet_id",
                table: "immediate_orders",
                columns: new[] { "order_date", "delivery_turn_id", "outlet_id" });

            migrationBuilder.CreateIndex(
                name: "IX_immediate_orders_order_no",
                table: "immediate_orders",
                column: "order_no",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_immediate_orders_outlet_id",
                table: "immediate_orders",
                column: "outlet_id");

            migrationBuilder.CreateIndex(
                name: "IX_immediate_orders_product_id",
                table: "immediate_orders",
                column: "product_id");

            migrationBuilder.CreateIndex(
                name: "IX_immediate_orders_status",
                table: "immediate_orders",
                column: "status");

            migrationBuilder.CreateIndex(
                name: "IX_immediate_orders_UpdatedById",
                table: "immediate_orders",
                column: "UpdatedById");

            migrationBuilder.CreateIndex(
                name: "IX_ingredients_CategoryId",
                table: "ingredients",
                column: "CategoryId");

            migrationBuilder.CreateIndex(
                name: "IX_ingredients_Code",
                table: "ingredients",
                column: "Code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ingredients_CreatedById",
                table: "ingredients",
                column: "CreatedById");

            migrationBuilder.CreateIndex(
                name: "IX_ingredients_IngredientType",
                table: "ingredients",
                column: "IngredientType");

            migrationBuilder.CreateIndex(
                name: "IX_ingredients_IsActive",
                table: "ingredients",
                column: "IsActive");

            migrationBuilder.CreateIndex(
                name: "IX_ingredients_SortOrder",
                table: "ingredients",
                column: "SortOrder");

            migrationBuilder.CreateIndex(
                name: "IX_ingredients_UnitOfMeasureId",
                table: "ingredients",
                column: "UnitOfMeasureId");

            migrationBuilder.CreateIndex(
                name: "IX_ingredients_UpdatedById",
                table: "ingredients",
                column: "UpdatedById");

            migrationBuilder.CreateIndex(
                name: "IX_label_print_requests_approved_by_id",
                table: "label_print_requests",
                column: "approved_by_id");

            migrationBuilder.CreateIndex(
                name: "IX_label_print_requests_CreatedById",
                table: "label_print_requests",
                column: "CreatedById");

            migrationBuilder.CreateIndex(
                name: "IX_label_print_requests_date",
                table: "label_print_requests",
                column: "date");

            migrationBuilder.CreateIndex(
                name: "IX_label_print_requests_display_no",
                table: "label_print_requests",
                column: "display_no",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_label_print_requests_product_id",
                table: "label_print_requests",
                column: "product_id");

            migrationBuilder.CreateIndex(
                name: "IX_label_print_requests_status",
                table: "label_print_requests",
                column: "status");

            migrationBuilder.CreateIndex(
                name: "IX_label_print_requests_UpdatedById",
                table: "label_print_requests",
                column: "UpdatedById");

            migrationBuilder.CreateIndex(
                name: "IX_label_settings_CreatedById",
                table: "label_settings",
                column: "CreatedById");

            migrationBuilder.CreateIndex(
                name: "IX_label_settings_UpdatedById",
                table: "label_settings",
                column: "UpdatedById");

            migrationBuilder.CreateIndex(
                name: "IX_label_templates_CreatedById",
                table: "label_templates",
                column: "CreatedById");

            migrationBuilder.CreateIndex(
                name: "IX_label_templates_UpdatedById",
                table: "label_templates",
                column: "UpdatedById");

            migrationBuilder.CreateIndex(
                name: "IX_order_headers_CreatedById",
                table: "order_headers",
                column: "CreatedById");

            migrationBuilder.CreateIndex(
                name: "IX_order_headers_delivery_plan_id",
                table: "order_headers",
                column: "delivery_plan_id");

            migrationBuilder.CreateIndex(
                name: "IX_order_headers_IsActive",
                table: "order_headers",
                column: "IsActive");

            migrationBuilder.CreateIndex(
                name: "IX_order_headers_order_date",
                table: "order_headers",
                column: "order_date");

            migrationBuilder.CreateIndex(
                name: "IX_order_headers_order_no",
                table: "order_headers",
                column: "order_no",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_order_headers_status",
                table: "order_headers",
                column: "status");

            migrationBuilder.CreateIndex(
                name: "IX_order_headers_UpdatedById",
                table: "order_headers",
                column: "UpdatedById");

            migrationBuilder.CreateIndex(
                name: "IX_order_items_CreatedById",
                table: "order_items",
                column: "CreatedById");

            migrationBuilder.CreateIndex(
                name: "IX_order_items_delivery_turn_id",
                table: "order_items",
                column: "delivery_turn_id");

            migrationBuilder.CreateIndex(
                name: "IX_order_items_IsActive",
                table: "order_items",
                column: "IsActive");

            migrationBuilder.CreateIndex(
                name: "IX_order_items_order_header_id_product_id_outlet_id_delivery_t~",
                table: "order_items",
                columns: new[] { "order_header_id", "product_id", "outlet_id", "delivery_turn_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_order_items_outlet_id",
                table: "order_items",
                column: "outlet_id");

            migrationBuilder.CreateIndex(
                name: "IX_order_items_product_id",
                table: "order_items",
                column: "product_id");

            migrationBuilder.CreateIndex(
                name: "IX_order_items_UpdatedById",
                table: "order_items",
                column: "UpdatedById");

            migrationBuilder.CreateIndex(
                name: "IX_outlet_employees_CreatedById",
                table: "outlet_employees",
                column: "CreatedById");

            migrationBuilder.CreateIndex(
                name: "IX_outlet_employees_outlet_id",
                table: "outlet_employees",
                column: "outlet_id");

            migrationBuilder.CreateIndex(
                name: "IX_outlet_employees_UpdatedById",
                table: "outlet_employees",
                column: "UpdatedById");

            migrationBuilder.CreateIndex(
                name: "IX_outlet_employees_user_id",
                table: "outlet_employees",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "IX_outlets_CreatedById",
                table: "outlets",
                column: "CreatedById");

            migrationBuilder.CreateIndex(
                name: "IX_outlets_default_delivery_turn_id",
                table: "outlets",
                column: "default_delivery_turn_id");

            migrationBuilder.CreateIndex(
                name: "IX_outlets_UpdatedById",
                table: "outlets",
                column: "UpdatedById");

            migrationBuilder.CreateIndex(
                name: "IX_password_reset_tokens_ExpiresAt_IsUsed",
                table: "password_reset_tokens",
                columns: new[] { "ExpiresAt", "IsUsed" });

            migrationBuilder.CreateIndex(
                name: "IX_password_reset_tokens_Token",
                table: "password_reset_tokens",
                column: "Token",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_password_reset_tokens_UserId",
                table: "password_reset_tokens",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_permissions_Code",
                table: "permissions",
                column: "Code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_permissions_DisplayOrder",
                table: "permissions",
                column: "DisplayOrder");

            migrationBuilder.CreateIndex(
                name: "IX_permissions_Module",
                table: "permissions",
                column: "Module");

            migrationBuilder.CreateIndex(
                name: "IX_price_list_items_CreatedById",
                table: "price_list_items",
                column: "CreatedById");

            migrationBuilder.CreateIndex(
                name: "IX_price_list_items_price_list_id",
                table: "price_list_items",
                column: "price_list_id");

            migrationBuilder.CreateIndex(
                name: "IX_price_list_items_product_id",
                table: "price_list_items",
                column: "product_id");

            migrationBuilder.CreateIndex(
                name: "IX_price_list_items_UpdatedById",
                table: "price_list_items",
                column: "UpdatedById");

            migrationBuilder.CreateIndex(
                name: "IX_price_lists_CreatedById",
                table: "price_lists",
                column: "CreatedById");

            migrationBuilder.CreateIndex(
                name: "IX_price_lists_UpdatedById",
                table: "price_lists",
                column: "UpdatedById");

            migrationBuilder.CreateIndex(
                name: "IX_production_adjustments_AdjustedAt",
                table: "production_adjustments",
                column: "AdjustedAt");

            migrationBuilder.CreateIndex(
                name: "IX_production_adjustments_ProductionPlanItemId",
                table: "production_adjustments",
                column: "ProductionPlanItemId");

            migrationBuilder.CreateIndex(
                name: "IX_production_cancels_approved_by_id",
                table: "production_cancels",
                column: "approved_by_id");

            migrationBuilder.CreateIndex(
                name: "IX_production_cancels_cancel_date",
                table: "production_cancels",
                column: "cancel_date");

            migrationBuilder.CreateIndex(
                name: "IX_production_cancels_cancel_no",
                table: "production_cancels",
                column: "cancel_no",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_production_cancels_CreatedById",
                table: "production_cancels",
                column: "CreatedById");

            migrationBuilder.CreateIndex(
                name: "IX_production_cancels_product_id",
                table: "production_cancels",
                column: "product_id");

            migrationBuilder.CreateIndex(
                name: "IX_production_cancels_status",
                table: "production_cancels",
                column: "status");

            migrationBuilder.CreateIndex(
                name: "IX_production_cancels_UpdatedById",
                table: "production_cancels",
                column: "UpdatedById");

            migrationBuilder.CreateIndex(
                name: "IX_production_plan_items_ProductId",
                table: "production_plan_items",
                column: "ProductId");

            migrationBuilder.CreateIndex(
                name: "IX_production_plan_items_ProductionPlanId_ProductionSectionId_~",
                table: "production_plan_items",
                columns: new[] { "ProductionPlanId", "ProductionSectionId", "ProductId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_production_plan_items_ProductionSectionId",
                table: "production_plan_items",
                column: "ProductionSectionId");

            migrationBuilder.CreateIndex(
                name: "IX_production_plans_ComputedDate",
                table: "production_plans",
                column: "ComputedDate");

            migrationBuilder.CreateIndex(
                name: "IX_production_plans_DeliveryPlanId",
                table: "production_plans",
                column: "DeliveryPlanId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_production_plans_Status",
                table: "production_plans",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_production_sections_CreatedById",
                table: "production_sections",
                column: "CreatedById");

            migrationBuilder.CreateIndex(
                name: "IX_production_sections_UpdatedById",
                table: "production_sections",
                column: "UpdatedById");

            migrationBuilder.CreateIndex(
                name: "IX_products_CategoryId",
                table: "products",
                column: "CategoryId");

            migrationBuilder.CreateIndex(
                name: "IX_products_Code",
                table: "products",
                column: "Code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_products_CreatedById",
                table: "products",
                column: "CreatedById");

            migrationBuilder.CreateIndex(
                name: "IX_products_IsActive",
                table: "products",
                column: "IsActive");

            migrationBuilder.CreateIndex(
                name: "IX_products_SortOrder",
                table: "products",
                column: "SortOrder");

            migrationBuilder.CreateIndex(
                name: "IX_products_UnitOfMeasureId",
                table: "products",
                column: "UnitOfMeasureId");

            migrationBuilder.CreateIndex(
                name: "IX_products_UpdatedById",
                table: "products",
                column: "UpdatedById");

            migrationBuilder.CreateIndex(
                name: "IX_recipe_components_BaseRecipeId",
                table: "recipe_components",
                column: "BaseRecipeId");

            migrationBuilder.CreateIndex(
                name: "IX_recipe_components_CreatedById",
                table: "recipe_components",
                column: "CreatedById");

            migrationBuilder.CreateIndex(
                name: "IX_recipe_components_IsActive",
                table: "recipe_components",
                column: "IsActive");

            migrationBuilder.CreateIndex(
                name: "IX_recipe_components_ProductionSectionId",
                table: "recipe_components",
                column: "ProductionSectionId");

            migrationBuilder.CreateIndex(
                name: "IX_recipe_components_RecipeId",
                table: "recipe_components",
                column: "RecipeId");

            migrationBuilder.CreateIndex(
                name: "IX_recipe_components_UpdatedById",
                table: "recipe_components",
                column: "UpdatedById");

            migrationBuilder.CreateIndex(
                name: "IX_recipe_ingredients_CreatedById",
                table: "recipe_ingredients",
                column: "CreatedById");

            migrationBuilder.CreateIndex(
                name: "IX_recipe_ingredients_IngredientId",
                table: "recipe_ingredients",
                column: "IngredientId");

            migrationBuilder.CreateIndex(
                name: "IX_recipe_ingredients_IsActive",
                table: "recipe_ingredients",
                column: "IsActive");

            migrationBuilder.CreateIndex(
                name: "IX_recipe_ingredients_RecipeComponentId",
                table: "recipe_ingredients",
                column: "RecipeComponentId");

            migrationBuilder.CreateIndex(
                name: "IX_recipe_ingredients_UpdatedById",
                table: "recipe_ingredients",
                column: "UpdatedById");

            migrationBuilder.CreateIndex(
                name: "IX_recipe_templates_CategoryId",
                table: "recipe_templates",
                column: "CategoryId");

            migrationBuilder.CreateIndex(
                name: "IX_recipe_templates_Code",
                table: "recipe_templates",
                column: "Code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_recipe_templates_CreatedById",
                table: "recipe_templates",
                column: "CreatedById");

            migrationBuilder.CreateIndex(
                name: "IX_recipe_templates_IsActive",
                table: "recipe_templates",
                column: "IsActive");

            migrationBuilder.CreateIndex(
                name: "IX_recipe_templates_UpdatedById",
                table: "recipe_templates",
                column: "UpdatedById");

            migrationBuilder.CreateIndex(
                name: "IX_recipes_CreatedById",
                table: "recipes",
                column: "CreatedById");

            migrationBuilder.CreateIndex(
                name: "IX_recipes_IsActive",
                table: "recipes",
                column: "IsActive");

            migrationBuilder.CreateIndex(
                name: "IX_recipes_ProductId",
                table: "recipes",
                column: "ProductId");

            migrationBuilder.CreateIndex(
                name: "IX_recipes_TemplateId",
                table: "recipes",
                column: "TemplateId");

            migrationBuilder.CreateIndex(
                name: "IX_recipes_UpdatedById",
                table: "recipes",
                column: "UpdatedById");

            migrationBuilder.CreateIndex(
                name: "IX_reconciliation_items_ProductId",
                table: "reconciliation_items",
                column: "ProductId");

            migrationBuilder.CreateIndex(
                name: "IX_reconciliation_items_ReconciliationId_ProductId",
                table: "reconciliation_items",
                columns: new[] { "ReconciliationId", "ProductId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_reconciliation_items_VarianceType",
                table: "reconciliation_items",
                column: "VarianceType");

            migrationBuilder.CreateIndex(
                name: "IX_reconciliations_DeliveryPlanId_OutletId",
                table: "reconciliations",
                columns: new[] { "DeliveryPlanId", "OutletId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_reconciliations_OutletId",
                table: "reconciliations",
                column: "OutletId");

            migrationBuilder.CreateIndex(
                name: "IX_reconciliations_ReconciliationDate",
                table: "reconciliations",
                column: "ReconciliationDate");

            migrationBuilder.CreateIndex(
                name: "IX_reconciliations_ReconciliationNo",
                table: "reconciliations",
                column: "ReconciliationNo",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_reconciliations_Status",
                table: "reconciliations",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_role_permissions_PermissionId",
                table: "role_permissions",
                column: "PermissionId");

            migrationBuilder.CreateIndex(
                name: "IX_role_permissions_RoleId_PermissionId",
                table: "role_permissions",
                columns: new[] { "RoleId", "PermissionId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_roles_CreatedById",
                table: "roles",
                column: "CreatedById");

            migrationBuilder.CreateIndex(
                name: "IX_roles_IsActive",
                table: "roles",
                column: "IsActive");

            migrationBuilder.CreateIndex(
                name: "IX_roles_Name",
                table: "roles",
                column: "Name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_rounding_rules_CreatedById",
                table: "rounding_rules",
                column: "CreatedById");

            migrationBuilder.CreateIndex(
                name: "IX_rounding_rules_UpdatedById",
                table: "rounding_rules",
                column: "UpdatedById");

            migrationBuilder.CreateIndex(
                name: "IX_section_consumables_CreatedById",
                table: "section_consumables",
                column: "CreatedById");

            migrationBuilder.CreateIndex(
                name: "IX_section_consumables_ingredient_id",
                table: "section_consumables",
                column: "ingredient_id");

            migrationBuilder.CreateIndex(
                name: "IX_section_consumables_production_section_id",
                table: "section_consumables",
                column: "production_section_id");

            migrationBuilder.CreateIndex(
                name: "IX_section_consumables_UpdatedById",
                table: "section_consumables",
                column: "UpdatedById");

            migrationBuilder.CreateIndex(
                name: "IX_security_policies_CreatedById",
                table: "security_policies",
                column: "CreatedById");

            migrationBuilder.CreateIndex(
                name: "IX_security_policies_UpdatedById",
                table: "security_policies",
                column: "UpdatedById");

            migrationBuilder.CreateIndex(
                name: "IX_shifts_code",
                table: "shifts",
                column: "code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_shifts_CreatedById",
                table: "shifts",
                column: "CreatedById");

            migrationBuilder.CreateIndex(
                name: "IX_shifts_display_order",
                table: "shifts",
                column: "display_order");

            migrationBuilder.CreateIndex(
                name: "IX_shifts_is_active",
                table: "shifts",
                column: "is_active");

            migrationBuilder.CreateIndex(
                name: "IX_shifts_name",
                table: "shifts",
                column: "name");

            migrationBuilder.CreateIndex(
                name: "IX_shifts_UpdatedById",
                table: "shifts",
                column: "UpdatedById");

            migrationBuilder.CreateIndex(
                name: "IX_showroom_label_requests_CreatedById",
                table: "showroom_label_requests",
                column: "CreatedById");

            migrationBuilder.CreateIndex(
                name: "IX_showroom_label_requests_outlet_id",
                table: "showroom_label_requests",
                column: "outlet_id");

            migrationBuilder.CreateIndex(
                name: "IX_showroom_label_requests_UpdatedById",
                table: "showroom_label_requests",
                column: "UpdatedById");

            migrationBuilder.CreateIndex(
                name: "IX_showroom_open_stock_CreatedById",
                table: "showroom_open_stock",
                column: "CreatedById");

            migrationBuilder.CreateIndex(
                name: "IX_showroom_open_stock_outlet_id",
                table: "showroom_open_stock",
                column: "outlet_id",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_showroom_open_stock_UpdatedById",
                table: "showroom_open_stock",
                column: "UpdatedById");

            migrationBuilder.CreateIndex(
                name: "IX_stock_adjustments_adjustment_date",
                table: "stock_adjustments",
                column: "adjustment_date");

            migrationBuilder.CreateIndex(
                name: "IX_stock_adjustments_adjustment_no",
                table: "stock_adjustments",
                column: "adjustment_no",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_stock_adjustments_approved_by_id",
                table: "stock_adjustments",
                column: "approved_by_id");

            migrationBuilder.CreateIndex(
                name: "IX_stock_adjustments_CreatedById",
                table: "stock_adjustments",
                column: "CreatedById");

            migrationBuilder.CreateIndex(
                name: "IX_stock_adjustments_product_id",
                table: "stock_adjustments",
                column: "product_id");

            migrationBuilder.CreateIndex(
                name: "IX_stock_adjustments_status",
                table: "stock_adjustments",
                column: "status");

            migrationBuilder.CreateIndex(
                name: "IX_stock_adjustments_UpdatedById",
                table: "stock_adjustments",
                column: "UpdatedById");

            migrationBuilder.CreateIndex(
                name: "IX_stock_bf_approved_by_id",
                table: "stock_bf",
                column: "approved_by_id");

            migrationBuilder.CreateIndex(
                name: "IX_stock_bf_bf_no",
                table: "stock_bf",
                column: "bf_no",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_stock_bf_CreatedById",
                table: "stock_bf",
                column: "CreatedById");

            migrationBuilder.CreateIndex(
                name: "IX_stock_bf_outlet_id_bf_date_product_id",
                table: "stock_bf",
                columns: new[] { "outlet_id", "bf_date", "product_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_stock_bf_product_id",
                table: "stock_bf",
                column: "product_id");

            migrationBuilder.CreateIndex(
                name: "IX_stock_bf_rejected_by_id",
                table: "stock_bf",
                column: "rejected_by_id");

            migrationBuilder.CreateIndex(
                name: "IX_stock_bf_status",
                table: "stock_bf",
                column: "status");

            migrationBuilder.CreateIndex(
                name: "IX_stock_bf_UpdatedById",
                table: "stock_bf",
                column: "UpdatedById");

            migrationBuilder.CreateIndex(
                name: "IX_stores_issue_note_items_IngredientId",
                table: "stores_issue_note_items",
                column: "IngredientId");

            migrationBuilder.CreateIndex(
                name: "IX_stores_issue_note_items_StoresIssueNoteId_IngredientId",
                table: "stores_issue_note_items",
                columns: new[] { "StoresIssueNoteId", "IngredientId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_stores_issue_notes_IssueDate",
                table: "stores_issue_notes",
                column: "IssueDate");

            migrationBuilder.CreateIndex(
                name: "IX_stores_issue_notes_IssueNoteNo",
                table: "stores_issue_notes",
                column: "IssueNoteNo",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_stores_issue_notes_ProductionPlanId_ProductionSectionId",
                table: "stores_issue_notes",
                columns: new[] { "ProductionPlanId", "ProductionSectionId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_stores_issue_notes_ProductionSectionId",
                table: "stores_issue_notes",
                column: "ProductionSectionId");

            migrationBuilder.CreateIndex(
                name: "IX_stores_issue_notes_Status",
                table: "stores_issue_notes",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_system_logs_Category",
                table: "system_logs",
                column: "Category");

            migrationBuilder.CreateIndex(
                name: "IX_system_logs_LogLevel",
                table: "system_logs",
                column: "LogLevel");

            migrationBuilder.CreateIndex(
                name: "IX_system_logs_Timestamp",
                table: "system_logs",
                column: "Timestamp");

            migrationBuilder.CreateIndex(
                name: "IX_system_settings_CreatedById",
                table: "system_settings",
                column: "CreatedById");

            migrationBuilder.CreateIndex(
                name: "IX_system_settings_UpdatedById",
                table: "system_settings",
                column: "UpdatedById");

            migrationBuilder.CreateIndex(
                name: "IX_transfer_items_CreatedById",
                table: "transfer_items",
                column: "CreatedById");

            migrationBuilder.CreateIndex(
                name: "IX_transfer_items_product_id",
                table: "transfer_items",
                column: "product_id");

            migrationBuilder.CreateIndex(
                name: "IX_transfer_items_transfer_id",
                table: "transfer_items",
                column: "transfer_id");

            migrationBuilder.CreateIndex(
                name: "IX_transfer_items_UpdatedById",
                table: "transfer_items",
                column: "UpdatedById");

            migrationBuilder.CreateIndex(
                name: "IX_transfers_approved_by_id",
                table: "transfers",
                column: "approved_by_id");

            migrationBuilder.CreateIndex(
                name: "IX_transfers_CreatedById",
                table: "transfers",
                column: "CreatedById");

            migrationBuilder.CreateIndex(
                name: "IX_transfers_from_outlet_id",
                table: "transfers",
                column: "from_outlet_id");

            migrationBuilder.CreateIndex(
                name: "IX_transfers_status",
                table: "transfers",
                column: "status");

            migrationBuilder.CreateIndex(
                name: "IX_transfers_to_outlet_id",
                table: "transfers",
                column: "to_outlet_id");

            migrationBuilder.CreateIndex(
                name: "IX_transfers_transfer_date",
                table: "transfers",
                column: "transfer_date");

            migrationBuilder.CreateIndex(
                name: "IX_transfers_transfer_no",
                table: "transfers",
                column: "transfer_no",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_transfers_UpdatedById",
                table: "transfers",
                column: "UpdatedById");

            migrationBuilder.CreateIndex(
                name: "IX_unit_of_measures_Code",
                table: "unit_of_measures",
                column: "Code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_unit_of_measures_CreatedById",
                table: "unit_of_measures",
                column: "CreatedById");

            migrationBuilder.CreateIndex(
                name: "IX_unit_of_measures_IsActive",
                table: "unit_of_measures",
                column: "IsActive");

            migrationBuilder.CreateIndex(
                name: "IX_unit_of_measures_UpdatedById",
                table: "unit_of_measures",
                column: "UpdatedById");

            migrationBuilder.CreateIndex(
                name: "IX_user_roles_AssignedById",
                table: "user_roles",
                column: "AssignedById");

            migrationBuilder.CreateIndex(
                name: "IX_user_roles_RoleId",
                table: "user_roles",
                column: "RoleId");

            migrationBuilder.CreateIndex(
                name: "IX_user_roles_UserId_RoleId",
                table: "user_roles",
                columns: new[] { "UserId", "RoleId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_users_Email",
                table: "users",
                column: "Email",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_users_IsSuperAdmin",
                table: "users",
                column: "IsSuperAdmin",
                unique: true,
                filter: "\"IsSuperAdmin\" = true");

            migrationBuilder.CreateIndex(
                name: "IX_workflow_configs_CreatedById",
                table: "workflow_configs",
                column: "CreatedById");

            migrationBuilder.CreateIndex(
                name: "IX_workflow_configs_UpdatedById",
                table: "workflow_configs",
                column: "UpdatedById");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "api_request_logs");

            migrationBuilder.DropTable(
                name: "approval_queue");

            migrationBuilder.DropTable(
                name: "audit_logs");

            migrationBuilder.DropTable(
                name: "authentication_logs");

            migrationBuilder.DropTable(
                name: "cancellations");

            migrationBuilder.DropTable(
                name: "daily_production_plans");

            migrationBuilder.DropTable(
                name: "daily_productions");

            migrationBuilder.DropTable(
                name: "day_locks");

            migrationBuilder.DropTable(
                name: "default_quantities");

            migrationBuilder.DropTable(
                name: "delivery_items");

            migrationBuilder.DropTable(
                name: "delivery_plan_items");

            migrationBuilder.DropTable(
                name: "delivery_return_items");

            migrationBuilder.DropTable(
                name: "disposal_items");

            migrationBuilder.DropTable(
                name: "freezer_stock_history");

            migrationBuilder.DropTable(
                name: "grid_configurations");

            migrationBuilder.DropTable(
                name: "immediate_orders");

            migrationBuilder.DropTable(
                name: "label_print_requests");

            migrationBuilder.DropTable(
                name: "label_settings");

            migrationBuilder.DropTable(
                name: "label_templates");

            migrationBuilder.DropTable(
                name: "order_items");

            migrationBuilder.DropTable(
                name: "outlet_employees");

            migrationBuilder.DropTable(
                name: "password_reset_tokens");

            migrationBuilder.DropTable(
                name: "price_list_items");

            migrationBuilder.DropTable(
                name: "production_adjustments");

            migrationBuilder.DropTable(
                name: "production_cancels");

            migrationBuilder.DropTable(
                name: "recipe_ingredients");

            migrationBuilder.DropTable(
                name: "reconciliation_items");

            migrationBuilder.DropTable(
                name: "role_permissions");

            migrationBuilder.DropTable(
                name: "rounding_rules");

            migrationBuilder.DropTable(
                name: "section_consumables");

            migrationBuilder.DropTable(
                name: "security_policies");

            migrationBuilder.DropTable(
                name: "showroom_label_requests");

            migrationBuilder.DropTable(
                name: "showroom_open_stock");

            migrationBuilder.DropTable(
                name: "stock_adjustments");

            migrationBuilder.DropTable(
                name: "stock_bf");

            migrationBuilder.DropTable(
                name: "stores_issue_note_items");

            migrationBuilder.DropTable(
                name: "system_logs");

            migrationBuilder.DropTable(
                name: "system_settings");

            migrationBuilder.DropTable(
                name: "transfer_items");

            migrationBuilder.DropTable(
                name: "user_roles");

            migrationBuilder.DropTable(
                name: "workflow_configs");

            migrationBuilder.DropTable(
                name: "shifts");

            migrationBuilder.DropTable(
                name: "deliveries");

            migrationBuilder.DropTable(
                name: "delivery_returns");

            migrationBuilder.DropTable(
                name: "disposals");

            migrationBuilder.DropTable(
                name: "freezer_stocks");

            migrationBuilder.DropTable(
                name: "order_headers");

            migrationBuilder.DropTable(
                name: "price_lists");

            migrationBuilder.DropTable(
                name: "production_plan_items");

            migrationBuilder.DropTable(
                name: "recipe_components");

            migrationBuilder.DropTable(
                name: "reconciliations");

            migrationBuilder.DropTable(
                name: "permissions");

            migrationBuilder.DropTable(
                name: "ingredients");

            migrationBuilder.DropTable(
                name: "stores_issue_notes");

            migrationBuilder.DropTable(
                name: "transfers");

            migrationBuilder.DropTable(
                name: "roles");

            migrationBuilder.DropTable(
                name: "recipes");

            migrationBuilder.DropTable(
                name: "production_plans");

            migrationBuilder.DropTable(
                name: "production_sections");

            migrationBuilder.DropTable(
                name: "outlets");

            migrationBuilder.DropTable(
                name: "products");

            migrationBuilder.DropTable(
                name: "recipe_templates");

            migrationBuilder.DropTable(
                name: "delivery_plans");

            migrationBuilder.DropTable(
                name: "unit_of_measures");

            migrationBuilder.DropTable(
                name: "categories");

            migrationBuilder.DropTable(
                name: "day_types");

            migrationBuilder.DropTable(
                name: "delivery_turns");

            migrationBuilder.DropTable(
                name: "users");
        }
    }
}

# Phase 7 Testing Checklist

## Overview
This checklist covers all runtime fixes applied to Phase 7 (Production & Stock Management) pages.

## Pages to Test

### 1. Daily Production (`/production/daily-production`)
- [ ] Page loads without errors
- [ ] Empty state displays correctly (no data)
- [ ] Search functionality works with product codes and names
- [ ] Status filter works (Pending, Approved, Rejected)
- [ ] Pagination works correctly
- [ ] Add new production modal opens and validates
- [ ] Edit production works for pending items
- [ ] View production details displays all fields correctly
- [ ] Approve/Reject actions work (admin only)
- [ ] Product dropdown loads and displays correctly
- [ ] Date picker respects date restrictions

### 2. Production Plan (`/production/production-plan`)
- [ ] Page loads without errors
- [ ] Empty state displays correctly (no data)
- [ ] Search functionality works
- [ ] Status filter works (Draft, Approved, InProgress, Completed)
- [ ] Priority badges display correctly (Low, Medium, High)
- [ ] Pagination works correctly
- [ ] Add new plan modal opens and validates
- [ ] Edit plan works for draft items
- [ ] View plan details displays all fields correctly
- [ ] Approve, Start, Complete actions work
- [ ] Product dropdown loads and displays correctly

### 3. Production Cancel (`/production/production-cancel`)
- [ ] Page loads without errors
- [ ] Empty state displays correctly (no data)
- [ ] Search functionality works
- [ ] Status filter works (Pending, Approved, Rejected)
- [ ] Pagination works correctly
- [ ] Add new cancellation modal opens and validates
- [ ] Edit cancellation works for pending items
- [ ] View cancellation details displays all fields correctly
- [ ] Approve/Reject actions work (admin only)
- [ ] Product dropdown loads and displays correctly
- [ ] Production number field works

### 4. Stock Adjustment (`/production/stock-adjustment`)
- [ ] Page loads without errors
- [ ] Empty state displays correctly (no data)
- [ ] Search functionality works
- [ ] Status filter works (Draft, Pending, Approved, Rejected)
- [ ] Pagination works correctly
- [ ] Add new adjustment modal opens and validates
- [ ] Adjustment type toggle works (Increase/Decrease)
- [ ] Edit adjustment works for draft items
- [ ] Submit for approval works
- [ ] View adjustment details displays all fields correctly
- [ ] Approve/Reject actions work (admin only)
- [ ] Product dropdown loads and displays correctly

### 5. Current Stock (`/production/current-stock`)
- [ ] Page loads without errors
- [ ] Empty state displays correctly (no data)
- [ ] All numeric columns display with 2 decimal places
- [ ] Search functionality works with product codes and names
- [ ] Pagination works correctly
- [ ] Refresh button works and updates timestamp
- [ ] Real-time clock updates correctly
- [ ] All stock calculations display correctly:
  - [ ] Open Balance
  - [ ] Today Production
  - [ ] Production Cancelled
  - [ ] Today Delivery
  - [ ] Delivery Cancelled
  - [ ] Delivery Returned
  - [ ] Stock Adjustment
  - [ ] Today Balance

### 6. Stock Adjustment Approval (`/production/stock-adjustment-approval`)
- [ ] Page loads without errors
- [ ] Empty state displays correctly (no pending approvals)
- [ ] Search functionality works
- [ ] Pagination works correctly
- [ ] View approval details displays all fields correctly
- [ ] Approve action works
- [ ] Reject action works (with reason prompt)
- [ ] Entity reference displays correctly

## Edge Cases to Test

### Empty/Null Data
- [ ] Test with no data returned from API
- [ ] Test with null/undefined product relationships
- [ ] Test with missing numeric values (should default to 0)
- [ ] Test with missing date values
- [ ] Test with missing user names

### Malformed API Responses
- [ ] Test with non-array response data
- [ ] Test with missing required fields
- [ ] Test with incorrect data types

### Search and Filter
- [ ] Search with empty string
- [ ] Search with special characters
- [ ] Search with product codes (undefined handling)
- [ ] Filter with "All Status" selected
- [ ] Combined search and filter

### Permissions
- [ ] Test as regular user (limited actions)
- [ ] Test as admin user (all actions)
- [ ] Test date restrictions with back-date permissions
- [ ] Test date restrictions without back-date permissions

## Network Errors
- [ ] Test with slow network (loading states)
- [ ] Test with API errors (error messages)
- [ ] Test with timeout errors
- [ ] Test offline behavior

## Browser Compatibility
- [ ] Chrome/Edge
- [ ] Firefox
- [ ] Safari (if applicable)

## Common Issues Fixed

### Issue 1: Array Filter Errors
**Symptom**: `productions.filter is not a function`  
**Fixed in**: All list pages  
**Test**: Load page with no data or malformed API response

### Issue 2: toFixed Errors
**Symptom**: `Cannot read properties of undefined (reading 'toFixed')`  
**Fixed in**: Current Stock page  
**Test**: Load Current Stock with missing numeric values

### Issue 3: Optional Chaining Errors
**Symptom**: `Cannot read properties of undefined (reading 'toLowerCase')`  
**Fixed in**: All list pages (search/filter)  
**Test**: Search with products that have missing relationships

### Issue 4: Products Filter Errors
**Symptom**: `Cannot read properties of undefined (reading 'filter')`  
**Fixed in**: All pages that fetch products  
**Test**: Load pages when products API returns unexpected data

## Testing Notes

- Use browser DevTools console to check for errors
- Test with Network tab throttling to simulate slow connections
- Test with Network tab offline to simulate connection failures
- Use React DevTools to inspect component state
- Check toast notifications display correctly
- Verify loading states display correctly
- Confirm empty states are user-friendly

## Sign-off

| Test Category | Status | Tested By | Date | Notes |
|--------------|--------|-----------|------|-------|
| Daily Production | ⬜ | | | |
| Production Plan | ⬜ | | | |
| Production Cancel | ⬜ | | | |
| Stock Adjustment | ⬜ | | | |
| Current Stock | ⬜ | | | |
| Stock Adjustment Approval | ⬜ | | | |
| Edge Cases | ⬜ | | | |
| Network Errors | ⬜ | | | |
| Browser Compatibility | ⬜ | | | |

Legend: ⬜ Not Started | 🔄 In Progress | ✅ Passed | ❌ Failed

import { getResource } from './resources'

export const reportEndpoints = {
  sales: '/reports/sales/',
  inventory: '/reports/inventory/',
  inventoryMovements: '/reports/inventory-movements/',
  productivity: '/reports/productivity/',
  incomeStatement: '/reports/income-statement/',
  salesByCustomer: '/reports/sales-by-customer/',
  salesByProduct: '/reports/sales-by-product/',
  trialBalance: '/reports/trial-balance/',
}

function withParams(path, params = {}) {
  const query = new URLSearchParams(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== ''),
  ).toString()
  return query ? `${path}?${query}` : path
}

export function getSalesReport(params) {
  return getResource(withParams(reportEndpoints.sales, params))
}

export function getInventoryReport(params) {
  return getResource(withParams(reportEndpoints.inventory, params))
}

export function getProductivityReport(params) {
  return getResource(withParams(reportEndpoints.productivity, params))
}

export function getIncomeStatement(params) {
  return getResource(withParams(reportEndpoints.incomeStatement, params))
}

export function getSalesByProduct(params) {
  return getResource(withParams(reportEndpoints.salesByProduct, params))
}

export function getSalesByCustomer(params) {
  return getResource(withParams(reportEndpoints.salesByCustomer, params))
}

export function getInventoryMovements(params) {
  return getResource(withParams(reportEndpoints.inventoryMovements, params))
}

export function getTrialBalance(params) {
  return getResource(withParams(reportEndpoints.trialBalance, params))
}

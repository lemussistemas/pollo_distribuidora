import { getResource } from './resources'

export const reportEndpoints = {
  sales: '/reports/sales/',
  inventory: '/reports/inventory/',
  productivity: '/reports/productivity/',
  incomeStatement: '/reports/income-statement/',
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

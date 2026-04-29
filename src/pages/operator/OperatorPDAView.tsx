import DashboardLayout from "@/components/layout/DashboardLayout";
import { KPICard } from "@/components/common/KPICard";
import { DataTable } from "@/components/common/DataTable";
import type { Column } from "@/components/common/DataTable";
import { operatorNavItems } from "@/config/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Wallet,
  ArrowUpCircle,
  ArrowDownCircle,
  Search,
  Building2,
  TrendingUp,
  TrendingDown,
  Loader2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { pdaService } from "@/services/pdaService";
import type { PreDepositAccount } from "@/types";
import { toast } from "sonner";
import { UI_MESSAGES } from "@/constants/messages";

export default function OperatorPDAView() {
  const [pdas, setPDAs] = useState<PreDepositAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchPDAs();
  }, []);

  const fetchPDAs = async () => {
    try {
      setLoading(true);
      const data = await pdaService.getAllPDAs();
      setPDAs(data);
    } catch (error) {
      toast.error(UI_MESSAGES.PDA.FETCH_FAILED);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const totalBalance = pdas.reduce((sum, pda) => sum + pda.balance, 0);
  const lowBalanceAccounts = pdas.filter((pda) => pda.balance < (pda.lowBalanceThreshold || 10000));

  const filteredPDAs = pdas.filter((pda) =>
    pda.customer.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const columns: Column<PreDepositAccount>[] = [
    { key: "customer", header: UI_MESSAGES.TABLE.CUSTOMER, sortable: true },
    {
      key: "balance",
      header: UI_MESSAGES.TABLE.BALANCE,
      sortable: true,
      render: (item) => (
        <span
          className={`font-medium ${item.balance < (item.lowBalanceThreshold || 10000) ? "text-destructive" : "text-success"}`}
        >
          {UI_MESSAGES.COMMON.CURRENCY_SYMBOL}{item.balance.toLocaleString()}
        </span>
      ),
    },
    {
      key: "lastUpdated",
      header: UI_MESSAGES.TABLE.LAST_UPDATE,
      render: (item) => new Date(item.lastUpdated).toLocaleString(),
    },
    {
      key: "status",
      header: UI_MESSAGES.TABLE.STATUS,
      render: (item) => (
        <StatusBadge status={item.balance < (item.lowBalanceThreshold || 10000) ? "warning" : "active"} />
      ),
    },
    {
      key: "actions",
      header: UI_MESSAGES.TABLE.ACTIONS,
      render: (item) => (
        <Dialog>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline">
              {UI_MESSAGES.TABLE.VIEW_DETAILS}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{UI_MESSAGES.PDA.ACCOUNT_DETAILS}</DialogTitle>
              <DialogDescription>{item.customer}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                <div>
                  <p className="text-sm text-muted-foreground">
                    {UI_MESSAGES.PDA.AVAILABLE_FUNDS}
                  </p>
                  <p
                    className={`text-3xl font-bold ${item.balance < (item.lowBalanceThreshold || 10000) ? "text-destructive" : "text-success"}`}
                  >
                    {UI_MESSAGES.COMMON.CURRENCY_SYMBOL}{item.balance.toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {item.balance < (item.lowBalanceThreshold || 10000) ? (
                    <TrendingDown className="h-8 w-8 text-destructive" />
                  ) : (
                    <TrendingUp className="h-8 w-8 text-success" />
                  )}
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="font-semibold mb-3">{UI_MESSAGES.PDA.RECENT_TRANSACTIONS}</h4>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {item.transactions?.map((tx) => (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between p-3 rounded-lg border"
                    >
                      <div className="flex items-center gap-3">
                        {tx.type === "credit" ? (
                          <ArrowUpCircle className="h-5 w-5 text-success" />
                        ) : (
                          <ArrowDownCircle className="h-5 w-5 text-destructive" />
                        )}
                        <div>
                          <p className="font-medium">{tx.description}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(tx.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p
                          className={`font-medium ${tx.type === "credit" ? "text-success" : "text-destructive"}`}
                        >
                          {tx.type === "credit" ? "+" : "-"}{UI_MESSAGES.COMMON.CURRENCY_SYMBOL}
                          {tx.amount.toLocaleString()}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {UI_MESSAGES.PDA.BALANCE_AFTER} {UI_MESSAGES.COMMON.CURRENCY_SYMBOL}{tx.balanceAfter.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                  {(!item.transactions || item.transactions.length === 0) && (
                    <p className="text-center py-4 text-muted-foreground">{UI_MESSAGES.PDA.NO_TRANSACTIONS_DESC}</p>
                  )}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      ),
    },
  ];

  if (loading) {
    return (
      <DashboardLayout navItems={operatorNavItems} pageTitle={UI_MESSAGES.TITLES.PDA_ACCOUNTS}>
        <div className="flex h-96 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      navItems={operatorNavItems}
      pageTitle={UI_MESSAGES.TITLES.PDA_ACCOUNTS}
    >
      {/* KPI Cards */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title={UI_MESSAGES.PDA.TOTAL_PDA_BALANCE}
          value={`${UI_MESSAGES.COMMON.CURRENCY_SYMBOL}${totalBalance.toLocaleString()}`}
          icon={Wallet}
          variant="success"
        />
        <KPICard
          title={UI_MESSAGES.TABLE.CUSTOMER}
          value={pdas.length}
          icon={Building2}
          variant="primary"
        />
        <KPICard
          title={UI_MESSAGES.KPI.LOW_BALANCE_ALERT}
          value={lowBalanceAccounts.length}
          icon={TrendingDown}
          variant="warning"
        />
        <KPICard title={UI_MESSAGES.KPI.ACTIVE} value={pdas.length} icon={TrendingUp} />
      </div>

      {/* Search */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex gap-3 max-w-md">
            <Input
              placeholder={UI_MESSAGES.PDA.SEARCH_CUSTOMER_PLACEHOLDER}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Button variant="outline">
              <Search className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* PDA List */}
      <Card>
        <CardHeader>
          <CardTitle>{UI_MESSAGES.PDA.PDA_ACCOUNTS}</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            data={filteredPDAs}
            columns={columns}
            searchable={false}
            emptyMessage={UI_MESSAGES.COMMON.NO_DATA}
          />
        </CardContent>
      </Card>

      {/* Quick Balance Overview */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>{UI_MESSAGES.PDA.BALANCE_OVERVIEW}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {pdas.map((pda) => (
              <div
                key={pda.id}
                className={`rounded-lg border p-4 ${pda.balance < (pda.lowBalanceThreshold || 10000) ? "border-destructive/50 bg-destructive/5" : ""}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold truncate">{pda.customer}</h4>
                  {pda.balance < (pda.lowBalanceThreshold || 10000) && (
                    <span className="text-xs text-destructive font-medium">
                      {UI_MESSAGES.PDA.LOW_BALANCE_LABEL}
                    </span>
                  )}
                </div>
                <p
                  className={`text-2xl font-bold ${pda.balance < (pda.lowBalanceThreshold || 10000) ? "text-destructive" : "text-foreground"}`}
                >
                  {UI_MESSAGES.COMMON.CURRENCY_SYMBOL}{pda.balance.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {UI_MESSAGES.PDA.UPDATED} {new Date(pda.lastUpdated).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}

import DashboardLayout from "@/components/layout/DashboardLayout";
import { operatorNavItems } from "@/config/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Search,
  Container,
  MapPin,
  Calendar,
  Clock,
  ArrowLeft,
  History as HistoryIcon,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchContainers, fetchContainerHistory } from "@/store/slices/containerSlice";
import { Loader2, AlertCircle } from "lucide-react";
import type { Container as ContainerType } from "@/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function OperatorContainerLookup() {
  const dispatch = useAppDispatch();
  const { containers, currentHistory: history, isLoading, error } = useAppSelector(
    (state) => state.container,
  );

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedContainer, setSelectedContainer] =
    useState<ContainerType | null>(null);
  const [searchResults, setSearchResults] = useState<ContainerType[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    dispatch(fetchContainers());
  }, [dispatch]);

  useEffect(() => {
    if (selectedContainer?.id) {
      dispatch(fetchContainerHistory(selectedContainer.id));
    }
  }, [selectedContainer, dispatch]);

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setHasSearched(false);
      setSelectedContainer(null);
      return;
    }

    const results = containers.filter((c) =>
      c.containerNumber.toLowerCase().includes(searchQuery.toLowerCase()),
    );
    setSearchResults(results);
    setHasSearched(true);

    if (results.length === 1) {
      setSelectedContainer(results[0]);
    } else {
      setSelectedContainer(null);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handleBack = () => {
    setSelectedContainer(null);
    setSearchQuery("");
    setSearchResults([]);
    setHasSearched(false);
  };

  return (
    <DashboardLayout navItems={operatorNavItems} pageTitle="Container Lookup">
      {/* Search Section */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search Container
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3 max-w-xl">
            <Input
              placeholder="Enter container number (e.g., MSCU1234567)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1"
            />
            <Button onClick={handleSearch}>
              <Search className="mr-2 h-4 w-4" />
              Search
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Search Results */}
      {hasSearched && searchResults.length > 1 && !selectedContainer && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Search Results ({searchResults.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {searchResults.map((container) => (
                <div
                  key={container.id}
                  className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 cursor-pointer"
                  onClick={() => setSelectedContainer(container)}
                >
                  <div className="flex items-center gap-3">
                    <Container className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{container.containerNumber}</p>
                      <p className="text-sm text-muted-foreground">
                        {container.size} • {container.type} •{" "}
                        {container.shippingLine}
                      </p>
                    </div>
                  </div>
                  <StatusBadge status={container.status} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Results */}
      {hasSearched && searchResults.length === 0 && (
        <Card className="mb-6">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Container className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">No Container Found</h3>
            <p className="text-muted-foreground">
              No container matches "{searchQuery}"
            </p>
          </CardContent>
        </Card>
      )}

      {/* Container Details */}
      {selectedContainer && (
        <div className="space-y-6">
          <Button
            variant="ghost"
            onClick={handleBack}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to List
          </Button>

          <Tabs defaultValue="details" className="space-y-4">
            <TabsList>
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>

            <TabsContent value="details">
              <div className="grid gap-6 lg:grid-cols-2">
                {/* Basic Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Container className="h-5 w-5" />
                      Container Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold">
                        {selectedContainer.containerNumber}
                      </span>
                      <StatusBadge status={selectedContainer.status} />
                    </div>
                    <Separator />
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-muted-foreground">Size</Label>
                        <p className="font-medium">{selectedContainer.size}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Type</Label>
                        <p className="font-medium capitalize">
                          {selectedContainer.type}
                        </p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Movement Type</Label>
                        <p className="font-medium capitalize">
                          {selectedContainer.movementType}
                        </p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Weight</Label>
                        <p className="font-medium">
                          {selectedContainer.weight
                            ? `${selectedContainer.weight} kg`
                            : "N/A"}
                        </p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Shipping Line</Label>
                        <p className="font-medium">
                          {selectedContainer.shippingLine}
                        </p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Customer</Label>
                        <p className="font-medium">
                          {selectedContainer.customer || "N/A"}
                        </p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Seal Number</Label>
                        <p className="font-medium">
                          {selectedContainer.sealNumber || "N/A"}
                        </p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Damaged</Label>
                        <p className="font-medium">
                          {selectedContainer.damaged ? "Yes" : "No"}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Location & Timing */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="h-5 w-5" />
                      Location & Timing
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="rounded-lg bg-muted/50 p-4">
                      <Label className="text-muted-foreground">
                        Current Yard Location
                      </Label>
                      {selectedContainer.yardLocation ? (
                        <p className="text-xl font-bold mt-1">
                          {selectedContainer.yardLocation.block}
                        </p>
                      ) : (
                        <p className="text-xl font-bold mt-1 text-muted-foreground">
                          Not in Yard
                        </p>
                      )}
                    </div>
                    <Separator />
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-start gap-2">
                        <Calendar className="h-4 w-4 mt-1 text-muted-foreground" />
                        <div>
                          <Label className="text-muted-foreground">
                            Gate-In Time
                          </Label>
                          <p className="font-medium">
                            {selectedContainer.gateInTime
                              ? new Date(
                                selectedContainer.gateInTime,
                              ).toLocaleString()
                              : "N/A"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <Calendar className="h-4 w-4 mt-1 text-muted-foreground" />
                        <div>
                          <Label className="text-muted-foreground">
                            Gate-Out Time
                          </Label>
                          <p className="font-medium">
                            {selectedContainer.gateOutTime
                              ? new Date(
                                selectedContainer.gateOutTime,
                              ).toLocaleString()
                              : "N/A"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2 col-span-2">
                        <Clock className="h-4 w-4 mt-1 text-muted-foreground" />
                        <div>
                          <Label className="text-muted-foreground">Dwell Time</Label>
                          <p className="font-medium">
                            {selectedContainer.dwellTime
                              ? `${selectedContainer.dwellTime} days`
                              : "N/A"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="history">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <HistoryIcon className="h-5 w-5" />
                    Container History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {history && history.length > 0 ? (
                      <div className="relative pl-6 border-l-2 border-muted space-y-8">
                        {history.map((item, index) => (
                          <div key={item.id || index} className="relative">
                            <div className="absolute -left-[31px] mt-1 h-4 w-4 rounded-full border-2 border-background bg-primary"></div>
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                              <div>
                                <h4 className="font-semibold text-lg">
                                  {item.activity}
                                </h4>
                                <p className="text-muted-foreground">
                                  {item.details}
                                </p>
                              </div>
                              <div className="text-sm text-muted-foreground bg-muted px-3 py-1 rounded-full flex items-center gap-2 shrink-0 self-start sm:self-center">
                                <Clock className="h-3 w-3" />
                                {new Date(item.timestamp).toLocaleString()}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 text-muted-foreground">
                        <HistoryIcon className="h-12 w-12 mx-auto mb-4 opacity-20" />
                        <p>No activity history recorded for this container.</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}

      {/* Container Lookups */}
      {!hasSearched && !selectedContainer && (
        <Card>
          <CardHeader>
            <CardTitle>Containers List</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                <p className="text-muted-foreground">Loading containers...</p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-12 text-destructive">
                <AlertCircle className="h-8 w-8 mb-2" />
                <p>{error}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => dispatch(fetchContainers())}
                  className="mt-4"
                >
                  Try Again
                </Button>
              </div>
            ) : containers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Container className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold">No Containers Found</h3>
                <p className="text-muted-foreground">
                  There are no containers in the system.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {containers.slice(0, 10).map((container) => (
                  <div
                    key={container.id}
                    className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 cursor-pointer"
                    onClick={() => {
                      setSelectedContainer(container);
                      setSearchQuery(container.containerNumber);
                      setHasSearched(true);
                      setSearchResults([container]);
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <Container className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">
                          {container.containerNumber}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {container.size} • {container.type} •{" "}
                          {container.shippingLine}
                        </p>
                      </div>
                    </div>
                    <StatusBadge status={container.status} />
                  </div>
                ))}
                {containers.length > 10 && (
                  <p className="text-center text-sm text-muted-foreground mt-4">
                    Showing first 10 containers. Use search to find specific
                    ones.
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </DashboardLayout>
  );
}

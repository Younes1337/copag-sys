interface TopBarProps {
  driverName: string;
  driverId: string;
  vehicleInfo: string;
  date: string;
}

export const TopBar = ({ driverName, driverId, vehicleInfo, date }: TopBarProps) => {
  return (
    <div className="bg-white border-b border-border px-8 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-1">{driverName}</h1>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span>ID {driverId}</span>
            <span>•</span>
            <span>{vehicleInfo}</span>
            <span>•</span>
            <span>{date}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

import ScheduleView from "@/components/ScheduleView";
import { seoulDate } from "@/lib/dates";

export const dynamic = "force-dynamic";

export default function Home() {
  return <ScheduleView today={seoulDate()} tomorrow={seoulDate(1)} />;
}

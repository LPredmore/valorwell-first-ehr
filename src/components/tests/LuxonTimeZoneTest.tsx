
import React, { useState, useEffect } from 'react';
import { DateTime } from 'luxon';
import { 
  createDateTime,
  convertToTimezone, 
  formatDateTime,
  getTimezoneDisplayName
} from '@/utils/luxonTimeUtils';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';

const SAMPLE_TIME_ZONES = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Europe/London',
  'Asia/Tokyo',
  'Australia/Sydney'
];

const LuxonTimeZoneTest: React.FC = () => {
  const [currentTime, setCurrentTime] = useState<DateTime>(DateTime.now());
  const [selectedSourceZone, setSelectedSourceZone] = useState<string>('America/New_York');
  const [selectedTargetZone, setSelectedTargetZone] = useState<string>('America/Los_Angeles');

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(DateTime.now());
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);

  const createTestTimes = (): { date: string, time: string }[] => {
    const result = [];
    const baseDate = DateTime.now().setZone(selectedSourceZone);
    
    // Regular time
    result.push({
      date: baseDate.toFormat('yyyy-MM-dd'),
      time: '10:00'
    });
    
    // Near midnight
    result.push({
      date: baseDate.toFormat('yyyy-MM-dd'),
      time: '23:30'
    });
    
    // DST transition times (spring forward)
    const springDST = DateTime.fromObject(
      { year: baseDate.year, month: 3, day: 14, hour: 2 }, 
      { zone: selectedSourceZone }
    );
    result.push({
      date: springDST.toFormat('yyyy-MM-dd'),
      time: '02:30'
    });
    
    // DST transition times (fall back)
    const fallDST = DateTime.fromObject(
      { year: baseDate.year, month: 11, day: 7, hour: 1 }, 
      { zone: selectedSourceZone }
    );
    result.push({
      date: fallDST.toFormat('yyyy-MM-dd'),
      time: '01:30'
    });
    
    return result;
  };

  const convertTestTimes = () => {
    const testTimes = createTestTimes();
    
    return testTimes.map((testTime, index) => {
      // Create DateTime in source time zone
      const sourceDateTime = createDateTime(
        testTime.date, 
        testTime.time, 
        selectedSourceZone
      );
      
      // Convert to target time zone
      const targetDateTime = convertToTimezone(
        sourceDateTime,
        selectedTargetZone
      );
      
      return {
        id: index,
        sourceDate: testTime.date,
        sourceTime: testTime.time,
        sourceFormatted: formatDateTime(sourceDateTime, 'yyyy-MM-dd h:mm a ZZZZ'),
        targetDate: targetDateTime.toFormat('yyyy-MM-dd'),
        targetTime: targetDateTime.toFormat('HH:mm'),
        targetFormatted: formatDateTime(targetDateTime, 'yyyy-MM-dd h:mm a ZZZZ'),
        isDST: {
          source: sourceDateTime.isInDST,
          target: targetDateTime.isInDST
        }
      };
    });
  };

  const testResults = convertTestTimes();

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Luxon Time Zone Testing</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Current Time Across Zones</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {SAMPLE_TIME_ZONES.map(zone => {
                const zonedTime = currentTime.setZone(zone);
                return (
                  <div key={zone} className="flex justify-between items-center border-b pb-2">
                    <div className="font-medium">{getTimezoneDisplayName(zone)}</div>
                    <div>{zonedTime.toFormat('yyyy-MM-dd h:mm:ss a')}</div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Time Zone Conversion</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Source Time Zone</label>
                  <select 
                    className="w-full border rounded px-3 py-2"
                    value={selectedSourceZone}
                    onChange={(e) => setSelectedSourceZone(e.target.value)}
                  >
                    {SAMPLE_TIME_ZONES.map(zone => (
                      <option key={`source-${zone}`} value={zone}>{getTimezoneDisplayName(zone)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Target Time Zone</label>
                  <select 
                    className="w-full border rounded px-3 py-2"
                    value={selectedTargetZone}
                    onChange={(e) => setSelectedTargetZone(e.target.value)}
                  >
                    {SAMPLE_TIME_ZONES.map(zone => (
                      <option key={`target-${zone}`} value={zone}>{getTimezoneDisplayName(zone)}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="border rounded-md overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-4 py-2 text-left text-sm font-medium">Source Time</th>
                      <th className="px-4 py-2 text-left text-sm font-medium">Target Time</th>
                      <th className="px-4 py-2 text-left text-sm font-medium">DST</th>
                    </tr>
                  </thead>
                  <tbody>
                    {testResults.map(result => (
                      <tr key={result.id} className="border-t">
                        <td className="px-4 py-2 text-sm">{result.sourceFormatted}</td>
                        <td className="px-4 py-2 text-sm">{result.targetFormatted}</td>
                        <td className="px-4 py-2 text-sm">
                          Source: {result.isDST.source ? "Yes" : "No"}<br />
                          Target: {result.isDST.target ? "Yes" : "No"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Time Zone Features Demonstration</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="formatting">
            <TabsList className="mb-4">
              <TabsTrigger value="formatting">Formatting</TabsTrigger>
              <TabsTrigger value="dst">DST Handling</TabsTrigger>
              <TabsTrigger value="arithmetic">Date Arithmetic</TabsTrigger>
            </TabsList>
            
            <TabsContent value="formatting">
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-md">
                  <h3 className="font-medium mb-2">Format Options</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Full DateTime:</p>
                      <p>{currentTime.setZone(selectedSourceZone).toFormat('DDDD')}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Short Date with Time:</p>
                      <p>{currentTime.setZone(selectedSourceZone).toFormat('ccc, LLL d, h:mm a')}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">With Timezone:</p>
                      <p>{currentTime.setZone(selectedSourceZone).toFormat('yyyy-MM-dd h:mm a ZZZZ')}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">ISO Format:</p>
                      <p>{currentTime.setZone(selectedSourceZone).toISO()}</p>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="dst">
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-md">
                  <h3 className="font-medium mb-2">DST Information</h3>
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Current Time is in DST:</p>
                      <p>{currentTime.setZone(selectedSourceZone).isInDST ? "Yes" : "No"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Offset from UTC:</p>
                      <p>{currentTime.setZone(selectedSourceZone).toFormat('Z')} hours</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Zone Abbreviation:</p>
                      <p>{currentTime.setZone(selectedSourceZone).toFormat('ZZZZ')}</p>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="arithmetic">
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-md">
                  <h3 className="font-medium mb-2">Date Arithmetic</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Current Time:</p>
                      <p>{currentTime.setZone(selectedSourceZone).toFormat('yyyy-MM-dd h:mm a ZZZZ')}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">One Day Later:</p>
                      <p>{currentTime.setZone(selectedSourceZone).plus({ days: 1 }).toFormat('yyyy-MM-dd h:mm a ZZZZ')}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">One Week Earlier:</p>
                      <p>{currentTime.setZone(selectedSourceZone).minus({ weeks: 1 }).toFormat('yyyy-MM-dd h:mm a ZZZZ')}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Start of Day:</p>
                      <p>{currentTime.setZone(selectedSourceZone).startOf('day').toFormat('yyyy-MM-dd h:mm a ZZZZ')}</p>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default LuxonTimeZoneTest;

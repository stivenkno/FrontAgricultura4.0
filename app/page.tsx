"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts"
import {
  Droplets,
  Thermometer,
  Sun,
  Gauge,
  Power,
  Play,
  Pause,
  Leaf,
  Zap,
  TrendingUp,
  Settings,
  Activity,
  Download,
  Calendar,
} from "lucide-react"



// Simulated sensor data
interface SensorData {
  humidity: number
  temperature: number
  light: number
  waterConsumption: number
  pumpStatus: boolean
  timestamp: Date
}

// Historical data point
interface HistoricalData {
  time: string
  humidity: number
  temperature: number
  light: number
  waterConsumption: number
  pumpStatus: number
  timestamp: Date
}

export default function AgriculturaPage() {
   const [messages, setMessages] = useState([]);
  const [socket, setSocket] = useState<WebSocket | null>(null);

  
  const [sensorData, setSensorData] = useState<SensorData>({
    humidity: 65,
    temperature: 24,
    light: 750,
    waterConsumption: 2.5,
    pumpStatus: false,
    timestamp: new Date(),
  })

  const [historicalData, setHistoricalData] = useState<HistoricalData[]>([])
  const [isSimulating, setIsSimulating] = useState(false)
  const [pumpPower, setPumpPower] = useState([75])
  const [humidityThreshold, setHumidityThreshold] = useState([40])
  const [manualPump, setManualPump] = useState(false)

  

  // Initialize historical data
  useEffect(() => {
    const initialData: HistoricalData[] = []
    const now = new Date()

    for (let i = 23; i >= 0; i--) {
      const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000)
      initialData.push({
        time: timestamp.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }),
        humidity: 40 + Math.random() * 40,
        temperature: 18 + Math.random() * 12,
        light: 200 + Math.random() * 600,
        waterConsumption: Math.random() * 5,
        pumpStatus: Math.random() > 0.7 ? 1 : 0,
        timestamp,
      })
    }

    setHistoricalData(initialData)
  }, [])

  // Simulation logic
  useEffect(() => {
    if (!isSimulating) return

    const interval = setInterval(() => {
      setSensorData((prev) => {
        let newHumidity = prev.humidity
        let newPumpStatus = prev.pumpStatus

        // Simulate automatic irrigation
        if (newHumidity < humidityThreshold[0] && !newPumpStatus) {
          newPumpStatus = true
        } else if (newHumidity > 80 && newPumpStatus) {
          newPumpStatus = false
        }

        // Update humidity based on pump status
        if (newPumpStatus) {
          newHumidity = Math.min(100, newHumidity + Math.random() * 3)
        } else {
          newHumidity = Math.max(0, newHumidity - Math.random() * 2)
        }

        const newData = {
          humidity: Math.round(newHumidity),
          temperature: 20 + Math.random() * 10,
          light: 300 + Math.random() * 700,
          waterConsumption: prev.waterConsumption + (newPumpStatus ? 0.1 : 0),
          pumpStatus: newPumpStatus || manualPump,
          timestamp: new Date(),
        }

        // Add to historical data
        setHistoricalData((prevHistory) => {
          const newHistoricalPoint: HistoricalData = {
            time: newData.timestamp.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }),
            humidity: newData.humidity,
            temperature: newData.temperature,
            light: newData.light,
            waterConsumption: newData.waterConsumption,
            pumpStatus: newData.pumpStatus ? 1 : 0,
            timestamp: newData.timestamp,
          }

          const updated = [...prevHistory, newHistoricalPoint]
          return updated.slice(-24) // Keep last 24 hours
        })

        return newData
      })
    }, 2000)

    return () => clearInterval(interval)
  }, [isSimulating, humidityThreshold, manualPump])


  useEffect(() => {
    // 👇 Conéctate al servidor (usa wss si está en HTTPS)
    const ws = new WebSocket("wss://servidor-ws-conexionesp32.onrender.com");

    ws.onopen = () => {
      console.log("✅ Conectado al servidor WebSocket");
      ws.send(JSON.stringify({ type: "client-msg", msg: "Conectado desde React" }));
      console.log("mensaje enviado")
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("📩 Mensaje recibido:", data);
        setMessages(prev => [...prev, data] as any);
      } catch (err) {
        console.error("⚠️ Error parseando mensaje:", err);
      }
    };

    ws.onclose = () => {
      console.log("🔌 Conexión cerrada");
    };

    ws.onerror = (error) => {
      console.error("⚠️ Error en la conexión WebSocket:", error);
    };

    // Guardamos el socket para poder usarlo en botones/envíos
    setSocket(ws);

    
  }, []);

  const enviarMensaje = () => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(
        JSON.stringify({ type: "client-msg", msg: "Mensaje desde React 🚀" })
      );
    } else {
      console.log("⚠️ El socket no está abierto");
    }
  };
  
  

  const getStatusColor = (value: number, optimal: [number, number]) => {
    if (value >= optimal[0] && value <= optimal[1]) return "text-green-500"
    if (value < optimal[0] * 0.8 || value > optimal[1] * 1.2) return "text-red-500"
    return "text-yellow-500"
  }

  const getStatusBadge = (value: number, optimal: [number, number]) => {
    if (value >= optimal[0] && value <= optimal[1])
      return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Óptimo</Badge>
    if (value < optimal[0] * 0.8 || value > optimal[1] * 1.2)
      return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Crítico</Badge>
    return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Advertencia</Badge>
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="text-sm font-medium mb-2">{`Hora: ${label}`}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {`${entry.name}: ${entry.value}${entry.name === "Humedad" ? "%" : entry.name === "Temperatura" ? "°C" : entry.name === "Luz" ? " lux" : entry.name === "Agua" ? "L" : ""}`}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-accent/5">
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:50px_50px]" />
        <div className="relative">
          <div className="container mx-auto px-4 py-16 text-center">
            <div className="flex items-center justify-center gap-3 mb-6">
              <Leaf className="h-12 w-12 text-primary" />
              <h1 className="text-5xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Agricultura 4.0
              </h1>
            </div>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto text-balance">
              Sistema de riego inteligente con monitoreo en tiempo real usando ESP32 y sensores IoT
            </p>
            <div className="flex items-center justify-center gap-4 mb-12">
              <Badge variant="secondary" className="px-4 py-2">
                <Activity className="h-4 w-4 mr-2" />
                Tiempo Real
              </Badge>
              <Badge variant="secondary" className="px-4 py-2">
                <Zap className="h-4 w-4 mr-2" />
                Automatizado
              </Badge>
              <Badge variant="secondary" className="px-4 py-2">
                <TrendingUp className="h-4 w-4 mr-2" />
                Eficiente
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="controls">Controles</TabsTrigger>
            <TabsTrigger value="simulation">Simulación</TabsTrigger>
            <TabsTrigger value="history">Historial</TabsTrigger>
            <TabsTrigger value="system">Sistema</TabsTrigger>
          </TabsList>

          {/* Real-time Dashboard */}
          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Humidity Card */}
              <Card className="border-border/50 bg-card/50 backdrop-blur">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Humedad del Suelo</CardTitle>
                  <Droplets className={`h-4 w-4 ${getStatusColor(sensorData.humidity, [40, 80])}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{sensorData.humidity}%</div>
                  <div className="flex items-center justify-between mt-2">
                    <Progress value={sensorData.humidity} className="flex-1 mr-2" />
                    {getStatusBadge(sensorData.humidity, [40, 80])}
                  </div>
                </CardContent>
              </Card>

              {/* Temperature Card */}
              <Card className="border-border/50 bg-card/50 backdrop-blur">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Temperatura</CardTitle>
                  <Thermometer className={`h-4 w-4 ${getStatusColor(sensorData.temperature, [18, 28])}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{sensorData.temperature.toFixed(1)}°C</div>
                  <div className="flex items-center justify-between mt-2">
                    <Progress value={(sensorData.temperature / 40) * 100} className="flex-1 mr-2" />
                    {getStatusBadge(sensorData.temperature, [18, 28])}
                  </div>
                </CardContent>
              </Card>

              {/* Light Card */}
              <Card className="border-border/50 bg-card/50 backdrop-blur">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Luz Ambiente</CardTitle>
                  <Sun className={`h-4 w-4 ${getStatusColor(sensorData.light, [300, 800])}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{Math.round(sensorData.light)} lux</div>
                  <div className="flex items-center justify-between mt-2">
                    <Progress value={(sensorData.light / 1000) * 100} className="flex-1 mr-2" />
                    {getStatusBadge(sensorData.light, [300, 800])}
                  </div>
                </CardContent>
              </Card>

              {/* Water Consumption Card */}
              <Card className="border-border/50 bg-card/50 backdrop-blur">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Consumo de Agua</CardTitle>
                  <Gauge className="h-4 w-4 text-blue-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{sensorData.waterConsumption.toFixed(1)}L</div>
                  <div className="flex items-center justify-between mt-2">
                    <div className="text-xs text-muted-foreground">Hoy</div>
                    <Badge variant="outline" className="text-xs">
                      {sensorData.pumpStatus ? "Activa" : "Inactiva"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Pump Status */}
            <Card className="border-border/50 bg-card/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Power className={`h-5 w-5 ${sensorData.pumpStatus ? "text-green-400" : "text-gray-400"}`} />
                  Estado de la Bomba
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div
                      className={`h-3 w-3 rounded-full ${sensorData.pumpStatus ? "bg-green-400 animate-pulse" : "bg-gray-400"}`}
                    />
                    <span className="text-lg font-medium">{sensorData.pumpStatus ? "ENCENDIDA" : "APAGADA"}</span>
                  </div>
                  <div className="text-sm text-muted-foreground">Potencia: {pumpPower[0]}%</div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Manual Controls */}
          <TabsContent value="controls" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Control Manual
                  </CardTitle>
                  <CardDescription>Controla la bomba y ajusta los parámetros del sistema</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Bomba Manual</label>
                    <Switch checked={manualPump} onCheckedChange={setManualPump} />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Potencia del Motor (PWM)</label>
                    <Slider value={pumpPower} onValueChange={setPumpPower} max={100} step={5} className="w-full" />
                    <div className="text-xs text-muted-foreground">Potencia: {pumpPower[0]}%</div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Umbral de Humedad</label>
                    <Slider
                      value={humidityThreshold}
                      onValueChange={setHumidityThreshold}
                      max={100}
                      step={5}
                      className="w-full"
                    />
                    <div className="text-xs text-muted-foreground">
                      Activar riego cuando humedad {"<"} {humidityThreshold[0]}%
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Estado del Sistema</CardTitle>
                  <CardDescription>Información en tiempo real del sistema de riego</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Conexión ESP32</span>
                    <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Conectado</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Última actualización</span>
                    <span className="text-xs text-muted-foreground">{sensorData.timestamp.toLocaleTimeString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Modo automático</span>
                    <Badge variant={manualPump ? "destructive" : "default"}>
                      {manualPump ? "Manual" : "Automático"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Interactive Simulation */}
          <TabsContent value="simulation" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Play className="h-5 w-5" />
                  Simulación Interactiva
                </CardTitle>
                <CardDescription>Simula el comportamiento del sistema de riego en tiempo real</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 mb-6">
                  <Button
                    onClick={() => setIsSimulating(!isSimulating)}
                    variant={isSimulating ? "destructive" : "default"}
                    className="flex items-center gap-2"
                  >
                    {isSimulating ? (
                      <>
                        <Pause className="h-4 w-4" />
                        Detener Simulación
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4" />
                        Iniciar Simulación
                      </>
                    )}
                  </Button>
                  {isSimulating && (
                    <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 animate-pulse">
                      Simulando...
                    </Badge>
                  )}
                </div>

                {isSimulating && (
                  <div className="bg-muted/50 rounded-lg p-4">
                    <h4 className="font-medium mb-2">Proceso de Simulación:</h4>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>• Los sensores generan datos realistas cada 2 segundos</p>
                      <p>• La bomba se activa automáticamente cuando la humedad baja del umbral</p>
                      <p>• El sistema simula el ciclo completo de riego</p>
                      <p>• Los gráficos y métricas se actualizan en tiempo real</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold">Historial y Estadísticas</h2>
                <p className="text-muted-foreground">Análisis de datos históricos del sistema de riego</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Calendar className="h-4 w-4 mr-2" />
                  Filtrar Fecha
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Exportar
                </Button>
              </div>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Humidity & Temperature Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Humedad y Temperatura
                  </CardTitle>
                  <CardDescription>Últimas 24 horas</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={historicalData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="humidity"
                        stroke="hsl(var(--chart-1))"
                        strokeWidth={2}
                        name="Humedad"
                        dot={{ fill: "hsl(var(--chart-1))", strokeWidth: 2, r: 4 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="temperature"
                        stroke="hsl(var(--chart-2))"
                        strokeWidth={2}
                        name="Temperatura"
                        dot={{ fill: "hsl(var(--chart-2))", strokeWidth: 2, r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Light & Water Consumption Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sun className="h-5 w-5" />
                    Luz y Consumo de Agua
                  </CardTitle>
                  <CardDescription>Últimas 24 horas</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={historicalData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="light"
                        stroke="hsl(var(--chart-3))"
                        strokeWidth={2}
                        name="Luz"
                        dot={{ fill: "hsl(var(--chart-3))", strokeWidth: 2, r: 4 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="waterConsumption"
                        stroke="hsl(var(--chart-4))"
                        strokeWidth={2}
                        name="Agua"
                        dot={{ fill: "hsl(var(--chart-4))", strokeWidth: 2, r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Pump Activity Chart */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Power className="h-5 w-5" />
                    Actividad de la Bomba
                  </CardTitle>
                  <CardDescription>Estado de la bomba a lo largo del tiempo</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={historicalData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <YAxis
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={12}
                        domain={[0, 1]}
                        tickFormatter={(value) => (value === 1 ? "ON" : "OFF")}
                      />
                      <Tooltip
                        content={({ active, payload, label }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
                                <p className="text-sm font-medium mb-2">{`Hora: ${label}`}</p>
                                <p className="text-sm" style={{ color: payload[0].color }}>
                                  {`Bomba: ${payload[0].value === 1 ? "ENCENDIDA" : "APAGADA"}`}
                                </p>
                              </div>
                            )
                          }
                          return null
                        }}
                      />
                      <Area
                        type="stepAfter"
                        dataKey="pumpStatus"
                        stroke="hsl(var(--chart-5))"
                        fill="hsl(var(--chart-5))"
                        fillOpacity={0.3}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Data Table */}
            <Card>
              <CardHeader>
                <CardTitle>Registro de Datos</CardTitle>
                <CardDescription>Últimos registros del sistema ({historicalData.length} entradas)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border max-h-96 overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fecha/Hora</TableHead>
                        <TableHead>Humedad (%)</TableHead>
                        <TableHead>Temperatura (°C)</TableHead>
                        <TableHead>Luz (lux)</TableHead>
                        <TableHead>Agua (L)</TableHead>
                        <TableHead>Bomba</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {historicalData
                        .slice(-10)
                        .reverse()
                        .map((record, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-mono text-sm">
                              {record.timestamp.toLocaleString("es-ES")}
                            </TableCell>
                            <TableCell>
                              <span className={getStatusColor(record.humidity, [40, 80])}>
                                {record.humidity.toFixed(1)}%
                              </span>
                            </TableCell>
                            <TableCell>
                              <span className={getStatusColor(record.temperature, [18, 28])}>
                                {record.temperature.toFixed(1)}°C
                              </span>
                            </TableCell>
                            <TableCell>
                              <span className={getStatusColor(record.light, [300, 800])}>
                                {Math.round(record.light)} lux
                              </span>
                            </TableCell>
                            <TableCell>{record.waterConsumption.toFixed(2)}L</TableCell>
                            <TableCell>
                              <Badge
                                variant={record.pumpStatus === 1 ? "default" : "secondary"}
                                className={
                                  record.pumpStatus === 1 ? "bg-green-500/20 text-green-400 border-green-500/30" : ""
                                }
                              >
                                {record.pumpStatus === 1 ? "ON" : "OFF"}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* System visualization with interactive diagram */}
          <TabsContent value="system" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* System Diagram */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    Diagrama del Sistema IoT
                  </CardTitle>
                  <CardDescription>Flujo de datos y control del sistema de riego inteligente</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="relative bg-gradient-to-br from-muted/30 to-muted/10 rounded-lg p-8 min-h-[400px]">
                    {/* Sensors Section */}
                    <div className="absolute top-4 left-4">
                      <div className="bg-card border-2 border-primary/30 rounded-lg p-4 shadow-lg">
                        <h4 className="font-semibold text-sm mb-2 text-primary">Sensores</h4>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-xs">
                            <Droplets className="h-3 w-3 text-blue-400" />
                            <span>Humedad del Suelo</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            <Thermometer className="h-3 w-3 text-orange-400" />
                            <span>Temperatura</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            <Sun className="h-3 w-3 text-yellow-400" />
                            <span>Luz Ambiente</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* ESP32 Controller */}
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                      <div className="bg-card border-2 border-accent/50 rounded-lg p-6 shadow-lg text-center">
                        <div className="bg-accent/20 rounded-full p-3 mx-auto mb-2 w-fit">
                          <Zap className="h-6 w-6 text-accent" />
                        </div>
                        <h4 className="font-bold text-accent">ESP32</h4>
                        <p className="text-xs text-muted-foreground mt-1">Controlador Principal</p>
                        <div className="mt-2">
                          <Badge
                            className={`text-xs ${sensorData.pumpStatus ? "bg-green-500/20 text-green-400 border-green-500/30" : "bg-gray-500/20 text-gray-400 border-gray-500/30"}`}
                          >
                            {sensorData.pumpStatus ? "Procesando" : "En Espera"}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Water Pump */}
                    <div className="absolute top-4 right-4">
                      <div className="bg-card border-2 border-blue-400/30 rounded-lg p-4 shadow-lg">
                        <h4 className="font-semibold text-sm mb-2 text-blue-400">Bomba de Agua</h4>
                        <div className="flex items-center gap-2">
                          <Power className={`h-4 w-4 ${sensorData.pumpStatus ? "text-green-400" : "text-gray-400"}`} />
                          <span className="text-xs">{sensorData.pumpStatus ? "ACTIVA" : "INACTIVA"}</span>
                        </div>
                        <div className="mt-2">
                          <Progress value={sensorData.pumpStatus ? pumpPower[0] : 0} className="h-2" />
                          <span className="text-xs text-muted-foreground">PWM: {pumpPower[0]}%</span>
                        </div>
                      </div>
                    </div>

                    {/* Plant */}
                    <div className="absolute bottom-4 right-4">
                      <div className="bg-card border-2 border-green-400/30 rounded-lg p-4 shadow-lg">
                        <h4 className="font-semibold text-sm mb-2 text-green-400">Planta</h4>
                        <div className="flex items-center gap-2">
                          <Leaf className="h-4 w-4 text-green-400" />
                          <span className="text-xs">
                            Estado:{" "}
                            {sensorData.humidity > 60
                              ? "Saludable"
                              : sensorData.humidity > 30
                                ? "Necesita Agua"
                                : "Crítico"}
                          </span>
                        </div>
                        <div className="mt-2">
                          <Progress value={sensorData.humidity} className="h-2" />
                          <span className="text-xs text-muted-foreground">Humedad: {sensorData.humidity}%</span>
                        </div>
                      </div>
                    </div>

                    {/* Web Interface */}
                    <div className="absolute bottom-4 left-4">
                      <div className="bg-card border-2 border-purple-400/30 rounded-lg p-4 shadow-lg">
                        <h4 className="font-semibold text-sm mb-2 text-purple-400">Interfaz Web</h4>
                        <div className="flex items-center gap-2">
                          <Activity className="h-4 w-4 text-purple-400" />
                          <span className="text-xs">Monitoreo en Tiempo Real</span>
                        </div>
                        <div className="mt-2 text-xs text-muted-foreground">
                          Última actualización: {sensorData.timestamp.toLocaleTimeString()}
                        </div>
                      </div>
                    </div>

                    {/* Connection Lines */}
                    <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>
                      {/* Sensors to ESP32 */}
                      <line
                        x1="25%"
                        y1="25%"
                        x2="50%"
                        y2="50%"
                        stroke="hsl(var(--primary))"
                        strokeWidth="2"
                        strokeDasharray="5,5"
                        className="animate-pulse"
                      />

                      {/* ESP32 to Pump */}
                      <line
                        x1="50%"
                        y1="50%"
                        x2="75%"
                        y2="25%"
                        stroke="hsl(var(--accent))"
                        strokeWidth="2"
                        strokeDasharray="5,5"
                        className={sensorData.pumpStatus ? "animate-pulse" : ""}
                      />

                      {/* Pump to Plant */}
                      <line
                        x1="75%"
                        y1="35%"
                        x2="75%"
                        y2="65%"
                        stroke="hsl(var(--chart-4))"
                        strokeWidth="3"
                        className={sensorData.pumpStatus ? "animate-pulse" : ""}
                      />

                      {/* ESP32 to Web */}
                      <line
                        x1="50%"
                        y1="50%"
                        x2="25%"
                        y2="75%"
                        stroke="hsl(var(--chart-5))"
                        strokeWidth="2"
                        strokeDasharray="5,5"
                        className="animate-pulse"
                      />
                    </svg>

                    {/* Data Flow Indicators */}
                    {isSimulating && (
                      <div className="absolute top-2 right-2">
                        <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 animate-pulse">
                          <Activity className="h-3 w-3 mr-1" />
                          Datos en Tiempo Real
                        </Badge>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* System Information */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Componentes del Sistema</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="bg-primary/20 rounded-full p-2">
                          <Droplets className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <h5 className="font-medium text-sm">Sensores IoT</h5>
                          <p className="text-xs text-muted-foreground">
                            Monitorean humedad del suelo, temperatura ambiente y niveles de luz
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="bg-accent/20 rounded-full p-2">
                          <Zap className="h-4 w-4 text-accent" />
                        </div>
                        <div>
                          <h5 className="font-medium text-sm">ESP32</h5>
                          <p className="text-xs text-muted-foreground">
                            Microcontrolador que procesa datos y controla la bomba automáticamente
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="bg-blue-400/20 rounded-full p-2">
                          <Power className="h-4 w-4 text-blue-400" />
                        </div>
                        <div>
                          <h5 className="font-medium text-sm">Bomba de Agua</h5>
                          <p className="text-xs text-muted-foreground">
                            Sistema de riego controlado por PWM con activación automática
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="bg-purple-400/20 rounded-full p-2">
                          <Activity className="h-4 w-4 text-purple-400" />
                        </div>
                        <div>
                          <h5 className="font-medium text-sm">Interfaz Web</h5>
                          <p className="text-xs text-muted-foreground">
                            Dashboard en tiempo real para monitoreo y control remoto
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Flujo de Operación</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="bg-primary rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold text-primary-foreground">
                          1
                        </div>
                        <span>Los sensores recolectan datos ambientales</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="bg-accent rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold text-accent-foreground">
                          2
                        </div>
                        <span>ESP32 procesa y analiza la información</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="bg-blue-400 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold text-white">
                          3
                        </div>
                        <span>Se activa la bomba si es necesario</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="bg-green-400 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold text-white">
                          4
                        </div>
                        <span>La planta recibe agua y mejora su estado</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="bg-purple-400 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold text-white">
                          5
                        </div>
                        <span>Los datos se muestran en la interfaz web</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Eficiencia del Sistema</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Ahorro de Agua</span>
                          <span className="font-medium text-green-400">85%</span>
                        </div>
                        <Progress value={85} className="h-2" />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Automatización</span>
                          <span className="font-medium text-blue-400">95%</span>
                        </div>
                        <Progress value={95} className="h-2" />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Precisión de Sensores</span>
                          <span className="font-medium text-purple-400">92%</span>
                        </div>
                        <Progress value={92} className="h-2" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Technical Specifications */}
            <Card>
              <CardHeader>
                <CardTitle>Especificaciones Técnicas</CardTitle>
                <CardDescription>Detalles técnicos del sistema Agricultura 4.0</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm text-primary">Hardware</h4>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      <li>• ESP32 DevKit V1</li>
                      <li>• Sensor de humedad del suelo</li>
                      <li>• Sensor DHT22 (temp/humedad)</li>
                      <li>• Fotoresistencia LDR</li>
                      <li>• Bomba de agua 12V</li>
                      <li>• Relé 5V</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm text-accent">Conectividad</h4>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      <li>• WiFi 802.11 b/g/n</li>
                      <li>• Protocolo HTTP/HTTPS</li>
                      <li>• WebSocket para tiempo real</li>
                      <li>• API RESTful</li>
                      <li>• OTA Updates</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm text-blue-400">Software</h4>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      <li>• Arduino IDE / PlatformIO</li>
                      <li>• React + Next.js</li>
                      <li>• Tailwind CSS</li>
                      <li>• Recharts para gráficos</li>
                      <li>• PWA compatible</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm text-green-400">Características</h4>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      <li>• Riego automático inteligente</li>
                      <li>• Control manual remoto</li>
                      <li>• Historial de datos</li>
                      <li>• Alertas en tiempo real</li>
                      <li>• Modo simulación</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

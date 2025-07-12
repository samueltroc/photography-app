import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Slider,
  Button,
  ToggleButton,
  ToggleButtonGroup,
  Card,
  CardContent,
  Switch,
  FormControlLabel,
  Divider,
  Chip,
  IconButton,
  Tooltip,
  useTheme,
  useMediaQuery,
  Fab,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  AppBar,
  Toolbar,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import {
  Camera,
  Settings,
  FlashOn,
  FlashOff,
  Timer,
  GridOn,
  GridOff,
  PhotoCamera,
  Videocam,
  AutoAwesome,
  Speed,
  Exposure,
  Iso,
  WbSunny,
  BlurOn,
  FilterAlt,
  Menu,
  Close,
  Download,
  Share,
  CameraAlt,
  CameraEnhance,
  TouchApp,
  Gesture,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

interface CameraSettings {
  aperture: number;
  shutterSpeed: number;
  iso: number;
  whiteBalance: string;
  focusMode: string;
  flashMode: string;
  exposureCompensation: number;
  meteringMode: string;
}

interface PhotographyMode {
  name: string;
  description: string;
  icon: React.ReactNode;
  settings: Partial<CameraSettings>;
  tips: string[];
}

const PhotographyApp: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmallMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [currentMode, setCurrentMode] = useState<string>('manual');
  const [settings, setSettings] = useState<CameraSettings>({
    aperture: 2.8,
    shutterSpeed: 1/125,
    iso: 100,
    whiteBalance: 'auto',
    focusMode: 'auto',
    flashMode: 'off',
    exposureCompensation: 0,
    meteringMode: 'matrix',
  });

  const [isLiveView, setIsLiveView] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const [showHistogram, setShowHistogram] = useState(false);
  const [timer, setTimer] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [lastCapturedPhoto, setLastCapturedPhoto] = useState<string | null>(null);
  const [showPhotoPreview, setShowPhotoPreview] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const photographyModes: Record<string, PhotographyMode> = {
    manual: {
      name: 'Manual',
      description: 'Control completo de todos los parámetros',
      icon: <Settings />,
      settings: {},
      tips: [
        'Ajusta la apertura para controlar la profundidad de campo',
        'La velocidad de obturación afecta el movimiento',
        'El ISO controla la sensibilidad a la luz',
      ],
    },
    freezeMotion: {
      name: 'Congelar Movimiento',
      description: 'Velocidades rápidas para capturar acción',
      icon: <Speed />,
      settings: {
        shutterSpeed: 1/1000,
        aperture: 5.6,
        iso: 400,
      },
      tips: [
        'Usa velocidades de 1/500s o más rápidas',
        'Aumenta el ISO si es necesario',
        'Considera usar flash para más luz',
      ],
    },
    lightPainting: {
      name: 'Light Painting',
      description: 'Exposiciones largas para pintar con luz',
      icon: <AutoAwesome />,
      settings: {
        shutterSpeed: 30,
        aperture: 8,
        iso: 100,
        focusMode: 'manual',
      },
      tips: [
        'Usa velocidades de 10-30 segundos',
        'Apertura cerrada para mayor nitidez',
        'ISO bajo para reducir ruido',
        'Usa trípode obligatoriamente',
      ],
    },
    panning: {
      name: 'Barrido Fotográfico',
      description: 'Seguir el movimiento del sujeto',
      icon: <BlurOn />,
      settings: {
        shutterSpeed: 1/30,
        aperture: 8,
        iso: 200,
        focusMode: 'continuous',
      },
      tips: [
        'Velocidades de 1/15 a 1/60 segundos',
        'Sigue el movimiento del sujeto',
        'Usa enfoque continuo',
        'Practica el movimiento suave',
      ],
    },
    portrait: {
      name: 'Retrato',
      description: 'Apertura amplia para fondo desenfocado',
      icon: <PhotoCamera />,
      settings: {
        aperture: 1.8,
        shutterSpeed: 1/125,
        iso: 100,
        focusMode: 'single',
      },
      tips: [
        'Apertura amplia (f/1.4 - f/2.8)',
        'Enfoca en los ojos',
        'Usa luz natural cuando sea posible',
        'Considera el fondo',
      ],
    },
    doubleExposure: {
      name: 'Doble Exposición',
      description: 'Combinar dos imágenes en una',
      icon: <FilterAlt />,
      settings: {
        aperture: 5.6,
        shutterSpeed: 1/60,
        iso: 200,
        exposureCompensation: -1,
      },
      tips: [
        'Subexpone cada toma por 1-2 pasos',
        'Planifica la composición',
        'Usa sujetos con siluetas definidas',
        'Experimenta con diferentes combinaciones',
      ],
    },
  };

  const handleModeChange = (mode: string) => {
    setCurrentMode(mode);
    if (photographyModes[mode]?.settings) {
      setSettings(prev => ({ ...prev, ...photographyModes[mode].settings }));
    }
    if (isMobile) {
      setMobileDrawerOpen(false);
    }
  };

  const handleSettingChange = (setting: keyof CameraSettings, value: any) => {
    setSettings(prev => ({ ...prev, [setting]: value }));
  };

  const startLiveView = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: isMobile ? 1280 : 1920 },
          height: { ideal: isMobile ? 720 : 1080 },
          facingMode: 'environment'
        } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsLiveView(true);
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      // Fallback para móvil: intentar con cámara frontal
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: 'user'
          } 
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setIsLiveView(true);
        }
      } catch (fallbackError) {
        console.error('Error accessing front camera:', fallbackError);
      }
    }
  };

  const stopLiveView = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      setIsLiveView(false);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      if (context) {
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);
        
        // Crear imagen para descarga móvil
        const imageData = canvas.toDataURL('image/jpeg', 0.9);
        setLastCapturedPhoto(imageData);
        setShowPhotoPreview(true);
        
        // Descarga automática en móvil
        if (isMobile) {
          const link = document.createElement('a');
          link.download = `photo_${Date.now()}.jpg`;
          link.href = imageData;
          link.click();
        }
      }
    }
  };

  const sharePhoto = async () => {
    if (lastCapturedPhoto && navigator.share) {
      try {
        // Convertir base64 a blob
        const response = await fetch(lastCapturedPhoto);
        const blob = await response.blob();
        const file = new File([blob], `photo_${Date.now()}.jpg`, { type: 'image/jpeg' });
        
        await navigator.share({
          title: 'Foto tomada con Fotografía Manual Pro',
          text: 'Mira esta foto que tomé con la app de fotografía manual',
          files: [file]
        });
      } catch (error) {
        console.error('Error sharing photo:', error);
      }
    }
  };

  const formatShutterSpeed = (speed: number) => {
    if (speed >= 1) return `${speed}s`;
    return `1/${Math.round(1/speed)}s`;
  };

  const formatAperture = (aperture: number) => {
    return `f/${aperture}`;
  };

  // Gestos táctiles para móvil
  const handleTouchStart = (e: React.TouchEvent) => {
    // Implementar gestos aquí si es necesario
  };

  useEffect(() => {
    return () => {
      stopLiveView();
    };
  }, []);

  // Componente de controles móviles optimizados
  const MobileControls = () => (
    <Box sx={{ 
      position: 'fixed', 
      bottom: 0, 
      left: 0, 
      right: 0, 
      bgcolor: 'rgba(0,0,0,0.8)', 
      p: 2,
      zIndex: 1000,
      backdropFilter: 'blur(10px)'
    }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
        <IconButton
          onClick={() => setMobileDrawerOpen(true)}
          sx={{ color: 'white', bgcolor: 'rgba(255,255,255,0.2)', p: 2 }}
        >
          <Menu />
        </IconButton>
        
        <Fab
          color="primary"
          size="large"
          onClick={capturePhoto}
          disabled={!isLiveView}
          sx={{ 
            width: 80, 
            height: 80,
            bgcolor: isLiveView ? 'primary.main' : 'grey.500'
          }}
        >
          <PhotoCamera sx={{ fontSize: 40 }} />
        </Fab>
        
        <IconButton
          onClick={isLiveView ? stopLiveView : startLiveView}
          sx={{ color: 'white', bgcolor: 'rgba(255,255,255,0.2)', p: 2 }}
        >
          {isLiveView ? <Close /> : <Camera />}
        </IconButton>
      </Box>
    </Box>
  );

  // Drawer móvil para controles
  const MobileDrawer = () => (
    <Drawer
      anchor="bottom"
      open={mobileDrawerOpen}
      onClose={() => setMobileDrawerOpen(false)}
      PaperProps={{
        sx: {
          maxHeight: '70vh',
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
        }
      }}
    >
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Controles de Cámara
        </Typography>
        
        {/* Modos de Fotografía */}
        <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
          Modos
        </Typography>
        <ToggleButtonGroup
          value={currentMode}
          exclusive
          onChange={(_, value) => value && handleModeChange(value)}
          orientation="horizontal"
          fullWidth
          sx={{ mb: 2 }}
        >
          {Object.entries(photographyModes).map(([key, mode]) => (
            <ToggleButton key={key} value={key} size="small">
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 1 }}>
                {mode.icon}
                <Typography variant="caption" sx={{ mt: 0.5 }}>
                  {mode.name}
                </Typography>
              </Box>
            </ToggleButton>
          ))}
        </ToggleButtonGroup>

        {/* Controles principales */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* Apertura */}
          <Box>
            <Typography variant="body2" gutterBottom>
              Apertura: {formatAperture(settings.aperture)}
            </Typography>
            <Slider
              value={settings.aperture}
              onChange={(_, value) => handleSettingChange('aperture', value)}
              min={1.4}
              max={22}
              step={0.1}
              marks={[
                { value: 1.4, label: '1.4' },
                { value: 2.8, label: '2.8' },
                { value: 5.6, label: '5.6' },
                { value: 11, label: '11' },
                { value: 22, label: '22' },
              ]}
            />
          </Box>

          {/* Velocidad */}
          <Box>
            <Typography variant="body2" gutterBottom>
              Velocidad: {formatShutterSpeed(settings.shutterSpeed)}
            </Typography>
            <Slider
              value={settings.shutterSpeed}
              onChange={(_, value) => handleSettingChange('shutterSpeed', value)}
              min={1/8000}
              max={30}
              step={1/8000}
              marks={[
                { value: 1/8000, label: '1/8000' },
                { value: 1/1000, label: '1/1000' },
                { value: 1/125, label: '1/125' },
                { value: 1, label: '1s' },
                { value: 30, label: '30s' },
              ]}
            />
          </Box>

          {/* ISO */}
          <Box>
            <Typography variant="body2" gutterBottom>
              ISO: {settings.iso}
            </Typography>
            <Slider
              value={settings.iso}
              onChange={(_, value) => handleSettingChange('iso', value)}
              min={50}
              max={6400}
              step={50}
              marks={[
                { value: 50, label: '50' },
                { value: 100, label: '100' },
                { value: 400, label: '400' },
                { value: 1600, label: '1600' },
                { value: 6400, label: '6400' },
              ]}
            />
          </Box>
        </Box>
      </Box>
    </Drawer>
  );

  return (
    <Box sx={{ height: '100vh', overflow: 'hidden' }}>
      {/* AppBar móvil */}
      {isMobile && (
        <AppBar position="fixed" sx={{ zIndex: 1200 }}>
          <Toolbar>
            <Typography variant="h6" sx={{ flexGrow: 1 }}>
              📸 Fotografía Pro
            </Typography>
            <IconButton
              onClick={() => setShowGrid(!showGrid)}
              sx={{ color: 'white' }}
            >
              {showGrid ? <GridOn /> : <GridOff />}
            </IconButton>
          </Toolbar>
        </AppBar>
      )}

      {/* Contenido principal */}
      <Box sx={{ 
        height: '100vh', 
        pt: isMobile ? 8 : 0,
        pb: isMobile ? 8 : 0,
        position: 'relative' 
      }}>
        {isMobile ? (
          // Layout móvil
          <Box sx={{ height: '100%', position: 'relative' }}>
            {/* Vista previa de cámara */}
            <Box sx={{ 
              position: 'relative', 
              width: '100%', 
              height: '100%', 
              bgcolor: 'black' 
            }}>
              {isLiveView ? (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    style={{ 
                      width: '100%', 
                      height: '100%', 
                      objectFit: 'cover' 
                    }}
                  />
                  {showGrid && (
                    <Box sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backgroundImage: `
                        linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)
                      `,
                      backgroundSize: '33.33% 33.33%',
                      pointerEvents: 'none',
                    }} />
                  )}
                  <canvas ref={canvasRef} style={{ display: 'none' }} />
                </>
              ) : (
                <Box sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  color: 'white',
                  flexDirection: 'column',
                }}>
                  <Camera sx={{ fontSize: 80, mb: 2 }} />
                  <Typography variant="h6" align="center">
                    Toca el botón de cámara para comenzar
                  </Typography>
                </Box>
              )}

              {/* Información de configuración móvil */}
              <Box sx={{
                position: 'absolute',
                top: 16,
                left: 16,
                color: 'white',
                bgcolor: 'rgba(0,0,0,0.7)',
                p: 1,
                borderRadius: 1,
                fontSize: '0.8rem',
              }}>
                {formatAperture(settings.aperture)} | {formatShutterSpeed(settings.shutterSpeed)} | ISO {settings.iso}
              </Box>

              {/* Indicador de modo */}
              <Box sx={{
                position: 'absolute',
                top: 16,
                right: 16,
                color: 'white',
                bgcolor: 'rgba(0,0,0,0.7)',
                p: 1,
                borderRadius: 1,
                fontSize: '0.8rem',
              }}>
                {photographyModes[currentMode].name}
              </Box>
            </Box>

            {/* Controles móviles */}
            <MobileControls />
            <MobileDrawer />
          </Box>
        ) : (
          // Layout desktop (mantener el original)
          <Container maxWidth="xl" sx={{ py: 3 }}>
            <Typography variant="h3" component="h1" gutterBottom align="center" sx={{ mb: 4 }}>
              📸 Fotografía Manual Pro
            </Typography>

            <Grid container spacing={3}>
              {/* Panel de Vista Previa */}
              <Grid size={{ xs: 12, md: 8 }}>
                <Paper elevation={3} sx={{ p: 2, height: '70vh', position: 'relative', overflow: 'hidden' }}>
                  <Box sx={{ position: 'relative', width: '100%', height: '100%', bgcolor: 'black' }}>
                    {isLiveView ? (
                      <>
                        <video
                          ref={videoRef}
                          autoPlay
                          playsInline
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                        {showGrid && (
                          <Box sx={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundImage: `
                              linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)
                            `,
                            backgroundSize: '33.33% 33.33%',
                            pointerEvents: 'none',
                          }} />
                        )}
                        <canvas ref={canvasRef} style={{ display: 'none' }} />
                      </>
                    ) : (
                      <Box sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '100%',
                        color: 'white',
                        flexDirection: 'column',
                      }}>
                        <Camera sx={{ fontSize: 80, mb: 2 }} />
                        <Typography variant="h6">Vista previa no disponible</Typography>
                        <Button
                          variant="contained"
                          onClick={startLiveView}
                          sx={{ mt: 2 }}
                          startIcon={<Camera />}
                        >
                          Activar Cámara
                        </Button>
                      </Box>
                    )}

                    {/* Controles de Vista Previa */}
                    <Box sx={{
                      position: 'absolute',
                      top: 16,
                      right: 16,
                      display: 'flex',
                      gap: 1,
                    }}>
                      <Tooltip title="Cuadrícula">
                        <IconButton
                          onClick={() => setShowGrid(!showGrid)}
                          sx={{ bgcolor: 'rgba(0,0,0,0.5)', color: 'white' }}
                        >
                          {showGrid ? <GridOn /> : <GridOff />}
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Histograma">
                        <IconButton
                          onClick={() => setShowHistogram(!showHistogram)}
                          sx={{ bgcolor: 'rgba(0,0,0,0.5)', color: 'white' }}
                        >
                          <Exposure />
                        </IconButton>
                      </Tooltip>
                    </Box>

                    {/* Información de Configuración */}
                    <Box sx={{
                      position: 'absolute',
                      bottom: 16,
                      left: 16,
                      color: 'white',
                      bgcolor: 'rgba(0,0,0,0.7)',
                      p: 1,
                      borderRadius: 1,
                    }}>
                      <Typography variant="body2">
                        {formatAperture(settings.aperture)} | {formatShutterSpeed(settings.shutterSpeed)} | ISO {settings.iso}
                      </Typography>
                    </Box>
                  </Box>
                </Paper>
              </Grid>

              {/* Panel de Controles */}
              <Grid size={{ xs: 12, md: 4 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, height: '70vh', overflowY: 'auto' }}>
                  
                  {/* Modos de Fotografía */}
                  <Paper elevation={2} sx={{ p: 2 }}>
                    <Typography variant="h6" gutterBottom>
                      Modos de Fotografía
                    </Typography>
                    <ToggleButtonGroup
                      value={currentMode}
                      exclusive
                      onChange={(_, value) => value && handleModeChange(value)}
                      orientation="vertical"
                      fullWidth
                    >
                      {Object.entries(photographyModes).map(([key, mode]) => (
                        <ToggleButton key={key} value={key} sx={{ justifyContent: 'flex-start', p: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {mode.icon}
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                {mode.name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {mode.description}
                              </Typography>
                            </Box>
                          </Box>
                        </ToggleButton>
                      ))}
                    </ToggleButtonGroup>
                  </Paper>

                  {/* Controles Manuales */}
                  <Paper elevation={2} sx={{ p: 2 }}>
                    <Typography variant="h6" gutterBottom>
                      Controles Manuales
                    </Typography>
                    
                    {/* Apertura */}
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" gutterBottom>
                        Apertura: {formatAperture(settings.aperture)}
                      </Typography>
                      <Slider
                        value={settings.aperture}
                        onChange={(_, value) => handleSettingChange('aperture', value)}
                        min={1.4}
                        max={22}
                        step={0.1}
                        marks={[
                          { value: 1.4, label: '1.4' },
                          { value: 2.8, label: '2.8' },
                          { value: 5.6, label: '5.6' },
                          { value: 11, label: '11' },
                          { value: 22, label: '22' },
                        ]}
                      />
                    </Box>

                    {/* Velocidad de Obturación */}
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" gutterBottom>
                        Velocidad: {formatShutterSpeed(settings.shutterSpeed)}
                      </Typography>
                      <Slider
                        value={settings.shutterSpeed}
                        onChange={(_, value) => handleSettingChange('shutterSpeed', value)}
                        min={1/8000}
                        max={30}
                        step={1/8000}
                        marks={[
                          { value: 1/8000, label: '1/8000' },
                          { value: 1/1000, label: '1/1000' },
                          { value: 1/125, label: '1/125' },
                          { value: 1, label: '1s' },
                          { value: 30, label: '30s' },
                        ]}
                      />
                    </Box>

                    {/* ISO */}
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" gutterBottom>
                        ISO: {settings.iso}
                      </Typography>
                      <Slider
                        value={settings.iso}
                        onChange={(_, value) => handleSettingChange('iso', value)}
                        min={50}
                        max={6400}
                        step={50}
                        marks={[
                          { value: 50, label: '50' },
                          { value: 100, label: '100' },
                          { value: 400, label: '400' },
                          { value: 1600, label: '1600' },
                          { value: 6400, label: '6400' },
                        ]}
                      />
                    </Box>

                    {/* Compensación de Exposición */}
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" gutterBottom>
                        Compensación: {settings.exposureCompensation > 0 ? '+' : ''}{settings.exposureCompensation} EV
                      </Typography>
                      <Slider
                        value={settings.exposureCompensation}
                        onChange={(_, value) => handleSettingChange('exposureCompensation', value)}
                        min={-3}
                        max={3}
                        step={0.3}
                        marks={[
                          { value: -3, label: '-3' },
                          { value: 0, label: '0' },
                          { value: 3, label: '+3' },
                        ]}
                      />
                    </Box>
                  </Paper>

                  {/* Configuraciones Adicionales */}
                  <Paper elevation={2} sx={{ p: 2 }}>
                    <Typography variant="h6" gutterBottom>
                      Configuraciones
                    </Typography>
                    
                    <FormControlLabel
                      control={
                        <Switch
                          checked={settings.flashMode === 'on'}
                          onChange={(e) => handleSettingChange('flashMode', e.target.checked ? 'on' : 'off')}
                        />
                      }
                      label="Flash"
                    />
                    
                    <FormControlLabel
                      control={
                        <Switch
                          checked={timer > 0}
                          onChange={(e) => setTimer(e.target.checked ? 3 : 0)}
                        />
                      }
                      label="Temporizador"
                    />
                  </Paper>

                  {/* Botones de Acción */}
                  <Paper elevation={2} sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                      <Button
                        variant="contained"
                        fullWidth
                        onClick={capturePhoto}
                        disabled={!isLiveView}
                        startIcon={<PhotoCamera />}
                      >
                        Capturar
                      </Button>
                      <Button
                        variant="outlined"
                        onClick={isLiveView ? stopLiveView : startLiveView}
                        startIcon={isLiveView ? <Videocam /> : <Camera />}
                      >
                        {isLiveView ? 'Detener' : 'Iniciar'}
                      </Button>
                    </Box>
                  </Paper>

                  {/* Consejos del Modo */}
                  {photographyModes[currentMode] && (
                    <Paper elevation={2} sx={{ p: 2 }}>
                      <Typography variant="h6" gutterBottom>
                        Consejos - {photographyModes[currentMode].name}
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        {photographyModes[currentMode].tips.map((tip, index) => (
                          <Chip
                            key={index}
                            label={tip}
                            size="small"
                            variant="outlined"
                            sx={{ textAlign: 'left', height: 'auto', '& .MuiChip-label': { whiteSpace: 'normal' } }}
                          />
                        ))}
                      </Box>
                    </Paper>
                  )}
                </Box>
              </Grid>
            </Grid>
          </Container>
        )}
      </Box>

      {/* Speed Dial para acciones rápidas en móvil */}
      {isMobile && isLiveView && (
        <SpeedDial
          ariaLabel="Acciones rápidas"
          sx={{ position: 'fixed', bottom: 100, right: 16 }}
          icon={<SpeedDialIcon />}
        >
          <SpeedDialAction
            icon={<Download />}
            tooltipTitle="Descargar"
            onClick={() => {
              if (lastCapturedPhoto) {
                const link = document.createElement('a');
                link.download = `photo_${Date.now()}.jpg`;
                link.href = lastCapturedPhoto;
                link.click();
              }
            }}
          />
          <SpeedDialAction
            icon={<Share />}
            tooltipTitle="Compartir"
            onClick={sharePhoto}
          />
          <SpeedDialAction
            icon={<CameraEnhance />}
            tooltipTitle="Cambiar cámara"
            onClick={() => {
              stopLiveView();
              setTimeout(startLiveView, 500);
            }}
          />
        </SpeedDial>
      )}
    </Box>
  );
};

export default PhotographyApp;

import React, { useState, useEffect, useRef } from 'react';
import {
  Typography,
  Box,
  Card,
  Button,
  ButtonGroup,
  Slider,
  Divider,
  IconButton,
  Tabs,
  Tab
} from '@mui/material';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import AddIcon from '@mui/icons-material/Add';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Fab from '@mui/material/Fab';
import CloseIcon from '@mui/icons-material/Close';
import VideocamIcon from '@mui/icons-material/Videocam';
import axios from 'axios';
import ClickSpark from './Animations/ClickSpark/ClickSpark';
import Particles from './Backgrounds/Particles/Particles';
import LinearProgress from '@mui/material/LinearProgress';
import DetectionPieChart from './DetectionPieChart';

const API_URL = 'http://localhost:8000';

const PT_BOX_SIZE = 160; // px
const PT_POINTER_SIZE = 32; // px

// Card style for space theme
const defaultCardStyle = {
  position: 'fixed',
  background: 'rgba(30,30,40,0.85)',
  boxShadow: '0 8px 32px 0 rgba(0,80,255,0.18)',
  backdropFilter: 'blur(24px)',
  borderRadius: '24px',
  border: '1.5px solid rgba(0,200,255,0.25)',
  color: '#eaf6ff',
  zIndex: 2,
};

// Helper to conditionally spread drag handlers
export const dragHandlers = (dragObj, locked) => locked ? {} : dragObj;

// Draggable logic for cards (with external dragRef)
export const makeDraggable = (pos, setPos, locked, dragRef) => {
  if (locked) return { style: { ...pos, cursor: 'default' } };
  return {
    onMouseDown: (e) => {
      if (e.preventDefault) e.preventDefault();
      dragRef.current = {
        dragging: true,
        startX: e.clientX,
        startY: e.clientY,
        orig: { ...pos },
        setPos,
      };
      const handleDrag = (e) => {
        if (!dragRef.current.dragging) return;
        let clientX, clientY;
        if (e.touches) {
          clientX = e.touches[0].clientX;
          clientY = e.touches[0].clientY;
        } else {
          clientX = e.clientX;
          clientY = e.clientY;
        }
        const dx = clientX - dragRef.current.startX;
        const dy = clientY - dragRef.current.startY;
        const newPos = { ...dragRef.current.orig };
        if ('top' in newPos) newPos.top += dy;
        if ('left' in newPos) newPos.left += dx;
        if ('right' in newPos) newPos.right -= dx;
        if ('bottom' in newPos) newPos.bottom -= dy;
        dragRef.current.setPos(newPos);
      };
      const stopDrag = () => {
        dragRef.current = {};
        window.removeEventListener('mousemove', handleDrag);
        window.removeEventListener('mouseup', stopDrag);
        window.removeEventListener('touchmove', handleDrag);
        window.removeEventListener('touchend', stopDrag);
      };
      window.addEventListener('mousemove', handleDrag);
      window.addEventListener('mouseup', stopDrag);
    },
    onTouchStart: (e) => {
      const touch = e.touches[0];
      dragRef.current = {
        dragging: true,
        startX: touch.clientX,
        startY: touch.clientY,
        orig: { ...pos },
        setPos,
      };
      const handleDrag = (e) => {
        if (!dragRef.current.dragging) return;
        let clientX, clientY;
        if (e.touches) {
          clientX = e.touches[0].clientX;
          clientY = e.touches[0].clientY;
        } else {
          clientX = e.clientX;
          clientY = e.clientY;
        }
        const dx = clientX - dragRef.current.startX;
        const dy = clientY - dragRef.current.startY;
        const newPos = { ...dragRef.current.orig };
        if ('top' in newPos) newPos.top += dy;
        if ('left' in newPos) newPos.left += dx;
        if ('right' in newPos) newPos.right -= dx;
        if ('bottom' in newPos) newPos.bottom -= dy;
        dragRef.current.setPos(newPos);
      };
      const stopDrag = () => {
        dragRef.current = {};
        window.removeEventListener('touchmove', handleDrag);
        window.removeEventListener('touchend', stopDrag);
      };
      window.addEventListener('touchmove', handleDrag);
      window.addEventListener('touchend', stopDrag);
    },
    style: { cursor: 'grab', ...pos },
  };
};

function PanTiltBox({ pan, tilt, setPan, setTilt }) {
  const boxRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [pointer, setPointer] = useState({ x: 0, y: 0 }); // -1 to 1

  // Map pan/tilt to pointer position
  useEffect(() => {
    if (!dragging) {
      setPointer({
        x: (pan - 90) / 90,
        y: (tilt - 90) / 90
      });
    }
  }, [pan, tilt, dragging]);

  const clamp = (val, min, max) => Math.max(min, Math.min(max, val));

  // --- Pointer Events for robust dragging ---
  useEffect(() => {
    if (!dragging) return;
    const handlePointerMove = (e) => {
      if (!dragging) return;
      const rect = boxRef.current.getBoundingClientRect();
      let clientX, clientY;
      if (e.touches) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else {
        clientX = e.clientX;
        clientY = e.clientY;
      }
      let x = ((clientX - rect.left) / rect.width) * 2 - 1; // -1 to 1
      let y = ((clientY - rect.top) / rect.height) * 2 - 1; // -1 to 1
      x = clamp(x, -1, 1);
      y = clamp(y, -1, 1);
      setPointer({ x, y });
      setPan(Math.round(90 + x * 90));
      setTilt(Math.round(90 + y * 90));
    };
    const handlePointerUp = () => {
      setDragging(false);
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseup', handlePointerUp);
      window.removeEventListener('touchmove', handlePointerMove);
      window.removeEventListener('touchend', handlePointerUp);
    };
    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('mouseup', handlePointerUp);
    window.addEventListener('touchmove', handlePointerMove);
    window.addEventListener('touchend', handlePointerUp);
    return () => {
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseup', handlePointerUp);
      window.removeEventListener('touchmove', handlePointerMove);
      window.removeEventListener('touchend', handlePointerUp);
    };
  }, [dragging, setPan, setTilt]);

  // Only start drag if pointer is pressed
  const handlePointerDown = (e) => {
    e.preventDefault();
    setDragging(true);
  };

  // Calculate pointer position in px
  const px = (pointer.x * 0.5 + 0.5) * (PT_BOX_SIZE - PT_POINTER_SIZE);
  const py = (pointer.y * 0.5 + 0.5) * (PT_BOX_SIZE - PT_POINTER_SIZE);

  return (
    <Box
      ref={boxRef}
      sx={{
        width: PT_BOX_SIZE,
        height: PT_BOX_SIZE,
        background: 'linear-gradient(135deg, #B2DFD5 0%, #F7D9C4 100%)',
        borderRadius: 4,
        boxShadow: 4,
        position: 'relative',
        userSelect: 'none',
        touchAction: 'none',
        border: '3px solid #fff',
        mx: 'auto',
        my: 2,
        cursor: dragging ? 'grabbing' : 'grab',
        transition: 'box-shadow 0.2s',
        outline: dragging ? '2px solid #ff9800' : 'none',
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          left: px,
          top: py,
          width: PT_POINTER_SIZE,
          height: PT_POINTER_SIZE,
          background: dragging ? '#ff9800' : '#fff',
          borderRadius: '50%',
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
          border: '2px solid #185a9d',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 700,
          fontSize: 18,
          color: '#185a9d',
          zIndex: 2,
          transition: 'background 0.2s',
          cursor: dragging ? 'grabbing' : 'grab',
        }}
        onMouseDown={handlePointerDown}
        onTouchStart={handlePointerDown}
      >
        ●
      </Box>
      {/* Crosshairs */}
      <Box sx={{
        position: 'absolute',
        left: '50%',
        top: '50%',
        width: '100%',
        height: 2,
        bgcolor: '#fff8',
        transform: 'translate(-50%, -1px)',
        zIndex: 1,
      }} />
      <Box sx={{
        position: 'absolute',
        left: '50%',
        top: '50%',
        width: 2,
        height: '100%',
        bgcolor: '#fff8',
        transform: 'translate(-1px, -50%)',
        zIndex: 1,
      }} />
    </Box>
  );
}

const PathPlannerCard = React.memo(function PathPlannerCard({ pos, setPos, locked, setLocked, onStartPath, fwdTime, turnTime, fwdSpeed, turnSpeed, onClose, path, setPath }) {
  const size = 11;
  const dotSpacing = 36;
  const [moveProgress, setMoveProgress] = useState(0); // move index
  const [movePath, setMovePath] = useState([]); // path index after each move
  const isInPath = (x, y) => path.some(([px, py]) => px === x && py === y);
  const last = path[path.length - 1];
  const canAdd = (x, y) => {
    if (isInPath(x, y)) return false;
    if (!last) return x === 0 && y === 0;
    const [lx, ly] = last;
    return (Math.abs(lx - x) + Math.abs(ly - y) === 1);
  };
  const handleDotClick = (x, y) => {
    if (canAdd(x, y)) setPath([...path, [x, y]]);
  };
  const handleReset = () => setPath([[0, 0]]);
  // Convert path to moves (F/L/R) and also return the path index after each move
  const pathToMoves = () => {
    let moves = [];
    let pathIndices = [];
    let dir = 'E'; // Start facing right
    let [x, y] = path[0];
    let pathIdx = 0;
    const dirs = ['N', 'E', 'S', 'W'];
    const leftTurn = dir => dirs[(dirs.indexOf(dir) + 3) % 4];
    const rightTurn = dir => dirs[(dirs.indexOf(dir) + 1) % 4];
    for (let i = 1; i < path.length; ++i) {
      const [nx, ny] = path[i];
      let ndir;
      if (nx === x + 1 && ny === y) ndir = 'E';
      else if (nx === x - 1 && ny === y) ndir = 'W';
      else if (nx === x && ny === y + 1) ndir = 'S';
      else if (nx === x && ny === y - 1) ndir = 'N';
      else continue;
      // Turn if needed
      while (dir !== ndir) {
        // Decide left or right turn
        const dirIdx = dirs.indexOf(dir);
        const ndirIdx = dirs.indexOf(ndir);
        const diff = (ndirIdx - dirIdx + 4) % 4;
        if (diff === 1) {
          moves.push('R');
          pathIndices.push(pathIdx);
          dir = rightTurn(dir);
        } else if (diff === 3) {
          moves.push('L');
          pathIndices.push(pathIdx);
          dir = leftTurn(dir);
        } else if (diff === 2) {
          // 180 degree turn, can be two rights or two lefts (choose right)
          moves.push('R'); pathIndices.push(pathIdx); dir = rightTurn(dir);
          moves.push('R'); pathIndices.push(pathIdx); dir = rightTurn(dir);
        }
      }
      moves.push('F');
      pathIdx = i;
      pathIndices.push(pathIdx);
      x = nx; y = ny;
    }
    return { moves, pathIndices };
  };
  // Draggable logic for this card
  const dragRef = {};
  const drag = makeDraggable(pos, setPos, locked, dragRef);
  // Send path to rover
  const handleStart = async () => {
    setMoveProgress(0);
    const { moves, pathIndices } = pathToMoves();
    setMovePath(pathIndices);
    let left = 0, right = 0;
    for (let i = 0; i < moves.length; ++i) {
      setMoveProgress(i);
      const move = moves[i];
      if (move === 'F') {
        left = right = fwdSpeed; // Use slider speed instead of hardcoded 150
        await axios.post(`${API_URL}/command`, { left, right: right * -1, pan: 90, tilt: 90 });
        await new Promise(res => setTimeout(res, fwdTime * 1000));
        await axios.post(`${API_URL}/command`, { left: 0, right: 0, pan: 90, tilt: 90 });
        await new Promise(res => setTimeout(res, 500));
      } else if (move === 'R') {
        left = turnSpeed; right = -turnSpeed; // Use slider speed instead of hardcoded 120
        await axios.post(`${API_URL}/command`, { left, right: right * -1, pan: 90, tilt: 90 });
        await new Promise(res => setTimeout(res, turnTime * 1000));
        await axios.post(`${API_URL}/command`, { left: 0, right: 0, pan: 90, tilt: 90 });
        await new Promise(res => setTimeout(res, 500));
      } else if (move === 'L') {
        left = -turnSpeed; right = turnSpeed; // Use slider speed instead of hardcoded 120
        await axios.post(`${API_URL}/command`, { left, right: right * -1, pan: 90, tilt: 90 });
        await new Promise(res => setTimeout(res, turnTime * 1000));
        await axios.post(`${API_URL}/command`, { left: 0, right: 0, pan: 90, tilt: 90 });
        await new Promise(res => setTimeout(res, 500));
      }
      await new Promise(res => setTimeout(res, 200)); // Small pause between moves
    }
    setMoveProgress(moves.length);
  };
  // For progress bar and SVG highlight, use moveProgress and movePath
  const { moves, pathIndices } = pathToMoves();
  useEffect(() => { setMovePath(pathIndices); }, [path, pathIndices]);
  // Persist path to localStorage
  useEffect(() => {
    localStorage.setItem('rov_path_planner', JSON.stringify(path));
  }, [path]);
  return (
    <Card sx={{ ...defaultCardStyle, ...drag.style, width: 480 }} {...dragHandlers(drag, locked)}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', userSelect: 'none' }}>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 700, color: '#00eaff', textShadow: '0 0 8px #00eaff88', m: 0 }}>
          Path Planner
        </Typography>
        <Box>
          <IconButton size="small" onClick={() => setLocked(l => !l)} sx={{ color: '#00eaff', ml: 1 }}
            onMouseDown={e => e.stopPropagation()} onTouchStart={e => e.stopPropagation()}>
            {locked ? <LockIcon /> : <LockOpenIcon />}
          </IconButton>
          {onClose && (
            <IconButton size="small" onClick={onClose} sx={{ color: '#F77C7C', ml: 1 }}
              onMouseDown={e => e.stopPropagation()} onTouchStart={e => e.stopPropagation()}>
              <CloseIcon />
            </IconButton>
          )}
        </Box>
      </Box>
      <Divider sx={{ mb: 2, bgcolor: '#00eaff44' }} />
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 2 }}>
        <svg width={dotSpacing * (size - 1) + 32} height={dotSpacing * (size - 1) + 32} style={{ background: 'none' }}>
          {/* Path lines with progress highlight */}
          {path.length > 1 && path.map(([x, y], i) => i > 0 && (
            <line
              key={i}
              x1={path[i - 1][0] * dotSpacing + 16}
              y1={path[i - 1][1] * dotSpacing + 16}
              x2={x * dotSpacing + 16}
              y2={y * dotSpacing + 16}
              stroke={movePath && moveProgress > 0 && movePath.slice(0, moveProgress + 1).includes(i) ? '#00eaff' : '#00eaff44'}
              strokeWidth={movePath && moveProgress > 0 && movePath.slice(0, moveProgress + 1).includes(i) ? 6 : 4}
              strokeLinecap="round"
              opacity={movePath && moveProgress > 0 && movePath.slice(0, moveProgress + 1).includes(i) ? 1 : 0.5}
            />
          ))}
          {/* Dots with progress highlight */}
          {[...Array(size)].map((_, y) =>
            [...Array(size)].map((_, x) => {
              const idx = path.findIndex(([px, py]) => px === x && py === y);
              // Highlight the dot if it's the current path point after the current move
              const isCurrent = movePath && moveProgress < movePath.length && idx === movePath[moveProgress];
              return (
                <circle
                  key={x + ',' + y}
                  cx={x * dotSpacing + 16}
                  cy={y * dotSpacing + 16}
                  r={isInPath(x, y) ? 10 : 7}
                  fill={x === 0 && y === 0 ? '#00eaff' : isCurrent ? '#00eaff' : isInPath(x, y) ? '#fff' : '#222'}
                  stroke={isCurrent ? '#fff' : isInPath(x, y) ? '#00eaff' : '#888'}
                  strokeWidth={x === 0 && y === 0 ? 3 : isCurrent ? 4 : 2}
                  style={{ cursor: canAdd(x, y) ? 'pointer' : 'default', opacity: canAdd(x, y) || isInPath(x, y) ? 1 : 0.3 }}
                  onClick={() => handleDotClick(x, y)}
                />
              );
            })
          )}
        </svg>
      </Box>
      {/* Progress bar and step count */}
      <Box sx={{ width: '100%', mb: 1 }}>
        <LinearProgress variant="determinate" value={moves.length === 0 ? 0 : Math.min(100, (moveProgress / moves.length) * 100)} sx={{ height: 8, borderRadius: 4, bgcolor: '#222', '& .MuiLinearProgress-bar': { background: '#00eaff' } }} />
        <Typography variant="caption" sx={{ color: '#b2eaff', mt: 0.5, display: 'block', textAlign: 'center' }}>
          Step {Math.min(moveProgress + 1, moves.length)} of {moves.length}
        </Typography>
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
        <Button variant="contained" color="info" onClick={handleStart} sx={{ fontWeight: 700, px: 3, boxShadow: 2 }}>
          Start
        </Button>
        <Button variant="outlined" color="inherit" onClick={handleReset} sx={{ ml: 2, color: '#eaf6ff', borderColor: '#00eaff' }}>
          Reset
        </Button>
      </Box>
      <Typography variant="caption" sx={{ color: '#b2eaff', mt: 1 }}>
        Click to connect dots. Only 90° turns allowed. Start is blue.
      </Typography>
    </Card>
  );
});

// JoystickCard for real-time rover control
const JoystickCard = React.memo(function JoystickCard({ pos, setPos, locked, setLocked, onClose, fwdSpeed, turnSpeed }) {
  const size = 180;
  const stickSize = 48;
  const [dragging, setDragging] = useState(false);
  const [stick, setStick] = useState({ x: 0, y: 0 }); // -1 to 1
  const dragRef = useRef(null);
  // Send command to rover
  const sendMove = (x, y) => {
    // Fix: Up (y = -1) is forward, right (x = 1) is right
    const angle = Math.atan2(x, -y) * 180 / Math.PI; // 0 = up, 90 = right
    let left = 0, right = 0;
    const mag = Math.sqrt(x * x + y * y);
    if (mag < 0.2) {
      // Center: stop
      axios.post(`${API_URL}/command`, { left: 0, right: 0, pan: 90, tilt: 90 });
      return;
    }
    // 8 directions, 45° each, starting from up (0°)
    if (angle >= -22.5 && angle < 22.5) { // N (up)
      left = right = fwdSpeed;
    } else if (angle >= 22.5 && angle < 67.5) { // NE
      left = fwdSpeed;
      right = fwdSpeed / 2;
    } else if (angle >= 67.5 && angle < 112.5) { // E (right)
      left = fwdSpeed;
      right = -fwdSpeed;
    } else if (angle >= 112.5 && angle < 157.5) { // SE
      left = fwdSpeed / 2;
      right = -fwdSpeed;
    } else if (angle >= 157.5 || angle < -157.5) { // S (down)
      left = right = -fwdSpeed;
    } else if (angle >= -157.5 && angle < -112.5) { // SW
      left = -fwdSpeed;
      right = -fwdSpeed / 2;
    } else if (angle >= -112.5 && angle < -67.5) { // W (left)
      left = -fwdSpeed;
      right = fwdSpeed;
    } else if (angle >= -67.5 && angle < -22.5) { // NW
      left = -fwdSpeed / 2;
      right = fwdSpeed;
    }
    // Always multiply right by -1
    axios.post(`${API_URL}/command`, { left, right: right * -1, pan: 90, tilt: 90 });
  };
  // Drag logic
  const handlePointerDown = (e) => {
    setDragging(true);
    dragRef.current = true;
  };
  useEffect(() => {
    if (!dragging) return;
    const handlePointerMove = (e) => {
      let clientX, clientY;
      if (e.touches) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else {
        clientX = e.clientX;
        clientY = e.clientY;
      }
      const rect = document.getElementById('joystick-area').getBoundingClientRect();
      let x = ((clientX - rect.left) / rect.width) * 2 - 1;
      let y = ((clientY - rect.top) / rect.height) * 2 - 1;
      // Clamp to circle
      const mag = Math.sqrt(x * x + y * y);
      if (mag > 1) {
        x /= mag;
        y /= mag;
      }
      setStick({ x, y });
      sendMove(x, y);
    };
    const handlePointerUp = () => {
      setDragging(false);
      setStick({ x: 0, y: 0 });
      sendMove(0, 0);
      dragRef.current = false;
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseup', handlePointerUp);
      window.removeEventListener('touchmove', handlePointerMove);
      window.removeEventListener('touchend', handlePointerUp);
    };
    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('mouseup', handlePointerUp);
    window.addEventListener('touchmove', handlePointerMove);
    window.addEventListener('touchend', handlePointerUp);
    return () => {
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseup', handlePointerUp);
      window.removeEventListener('touchmove', handlePointerMove);
      window.removeEventListener('touchend', handlePointerUp);
    };
  }, [dragging, sendMove]);
  // Position in px
  const px = (stick.x * 0.5 + 0.5) * (size - stickSize);
  const py = (stick.y * 0.5 + 0.5) * (size - stickSize);
  // Draggable logic for card
  const dragCardRef = {};
  const drag = makeDraggable(pos, setPos, locked, dragCardRef);
  return (
    <Card sx={{ ...defaultCardStyle, ...drag.style, width: 320 }} {...dragHandlers(drag, locked)}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', userSelect: 'none' }}>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 700, color: '#00eaff', textShadow: '0 0 8px #00eaff88', m: 0 }}>
          Joystick
        </Typography>
        <Box>
          <IconButton size="small" onClick={() => setLocked(l => !l)} sx={{ color: '#00eaff', ml: 1 }}
            onMouseDown={e => e.stopPropagation()} onTouchStart={e => e.stopPropagation()}>
            {locked ? <LockIcon /> : <LockOpenIcon />}
          </IconButton>
          {onClose && (
            <IconButton size="small" onClick={onClose} sx={{ color: '#F77C7C', ml: 1 }}
              onMouseDown={e => e.stopPropagation()} onTouchStart={e => e.stopPropagation()}>
              <CloseIcon />
            </IconButton>
          )}
        </Box>
      </Box>
      <Divider sx={{ mb: 2, bgcolor: '#00eaff44' }} />
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 2 }}>
        <Box id="joystick-area" sx={{ width: size, height: size, position: 'relative', background: 'radial-gradient(circle, #222 70%, #00eaff22 100%)', borderRadius: '50%', boxShadow: 4, userSelect: 'none', touchAction: 'none', border: '3px solid #00eaff', mb: 1 }}>
          {/* Crosshairs */}
          <Box sx={{ position: 'absolute', left: '50%', top: '50%', width: '100%', height: 2, bgcolor: '#00eaff44', transform: 'translate(-50%, -1px)', zIndex: 1 }} />
          <Box sx={{ position: 'absolute', left: '50%', top: '50%', width: 2, height: '100%', bgcolor: '#00eaff44', transform: 'translate(-1px, -50%)', zIndex: 1 }} />
          {/* Stick */}
          <Box
            sx={{
              position: 'absolute',
              left: px,
              top: py,
              width: stickSize,
              height: stickSize,
              background: dragging ? '#00eaff' : '#fff',
              borderRadius: '50%',
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
              border: '2px solid #185a9d',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: 18,
              color: '#185a9d',
              zIndex: 2,
              transition: 'background 0.2s',
              cursor: dragging ? 'grabbing' : 'grab',
            }}
            onMouseDown={handlePointerDown}
            onTouchStart={handlePointerDown}
          >
            {/* Elastic dot/line: always points to center of joystick area */}
            <svg width={stickSize} height={stickSize} style={{ position: 'absolute', left: 0, top: 0, pointerEvents: 'none' }}>
              <circle cx={stickSize / 2} cy={stickSize / 2} r={6} fill={dragging ? '#fff' : '#185a9d'} />
              {/* Draw a line from center of stick toward the center of joystick area */}
              {dragging && (stick.x !== 0 || stick.y !== 0) && (
                <line
                  x1={stickSize / 2}
                  y1={stickSize / 2}
                  x2={stickSize / 2 - (stick.x * (size / 2 - stickSize / 2))}
                  y2={stickSize / 2 - (stick.y * (size / 2 - stickSize / 2))}
                  stroke="#185a9d"
                  strokeWidth={4}
                  strokeLinecap="round"
                />
              )}
            </svg>
          </Box>
        </Box>
        <Typography variant="caption" sx={{ color: '#b2eaff', mt: 1 }}>
          Drag the stick to drive. Release to stop. Right motor is always -1×.
        </Typography>
      </Box>
    </Card>
  );
});

const DEFAULT_CAM_URL = 'http://localhost:8080/video';
const CameraFeedCard = React.memo(function CameraFeedCard({ pos, setPos, locked, setLocked, onClose }) {
  const [url, setUrl] = useState(() => {
    const saved = localStorage.getItem('rov_cam_url');
    return saved || DEFAULT_CAM_URL;
  });
  const [inputUrl, setInputUrl] = useState(url);
  const [editing, setEditing] = useState(false);
  // Save URL to localStorage
  useEffect(() => { localStorage.setItem('rov_cam_url', url); }, [url]);
  // Draggable logic
  const dragRef = {};
  const drag = makeDraggable(pos, setPos, locked, dragRef);
  return (
    <Card sx={{ ...defaultCardStyle, ...drag.style, width: 480 }} {...dragHandlers(drag, locked)}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', userSelect: 'none' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <VideocamIcon sx={{ color: '#00eaff', mr: 1 }} />
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 700, color: '#00eaff', textShadow: '0 0 8px #00eaff88', m: 0 }}>
            Camera Feed
          </Typography>
        </Box>
        <Box>
          <IconButton size="small" onClick={() => setLocked(l => !l)} sx={{ color: '#00eaff', ml: 1 }}
            onMouseDown={e => e.stopPropagation()} onTouchStart={e => e.stopPropagation()}>
            {locked ? <LockIcon /> : <LockOpenIcon />}
          </IconButton>
          {onClose && (
            <IconButton size="small" onClick={onClose} sx={{ color: '#F77C7C', ml: 1 }}
              onMouseDown={e => e.stopPropagation()} onTouchStart={e => e.stopPropagation()}>
              <CloseIcon />
            </IconButton>
          )}
        </Box>
      </Box>
      <Divider sx={{ mb: 2, bgcolor: '#00eaff44' }} />
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 2 }}>
        {/* Video feed */}
        <Box sx={{ width: 420, height: 315, background: '#111', borderRadius: 2, overflow: 'hidden', mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {/* Use <img> for MJPEG stream */}
          <img
            src={url}
            alt="Camera Feed"
            style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#111' }}
            onError={e => { e.target.style.display = 'none'; }}
          />
        </Box>
        <Box sx={{ width: '100%', display: 'flex', alignItems: 'center', gap: 1 }}>
          {editing ? (
            <>
              <input
                type="text"
                value={inputUrl}
                onChange={e => setInputUrl(e.target.value)}
                style={{ flex: 1, padding: 6, borderRadius: 4, border: '1px solid #00eaff', background: '#222', color: '#eaf6ff' }}
              />
              <Button size="small" variant="contained" color="info" sx={{ ml: 1 }} onClick={() => { setUrl(inputUrl); setEditing(false); }}>Save</Button>
              <Button size="small" variant="outlined" color="inherit" sx={{ ml: 1 }} onClick={() => { setInputUrl(url); setEditing(false); }}>Cancel</Button>
            </>
          ) : (
            <>
              <Typography variant="body2" sx={{ color: '#b2eaff', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{url}</Typography>
              <Button size="small" variant="outlined" color="info" sx={{ ml: 1 }} onClick={() => setEditing(true)}>Change URL</Button>
            </>
          )}
        </Box>
        <Typography variant="caption" sx={{ color: '#b2eaff', mt: 1 }}>Live MJPEG or HLS stream. Default: {DEFAULT_CAM_URL}</Typography>
      </Box>
    </Card>
  );
});

function parseLogEntries(logText) {
  // Parse log lines like: timestamp | ID: 1 | class: person | x: 123 | y: 456
  const lines = logText.split('\n').filter(Boolean);
  const typeCounts = {};
  for (const line of lines) {
    // Match class: ... (with or without trailing pipe)
    const match = line.match(/class: ([^|]+?)(?:\s*\||$)/);
    if (match) {
      const type = match[1].trim();
      typeCounts[type] = (typeCounts[type] || 0) + 1;
    }
  }
  return Object.entries(typeCounts).map(([type, count]) => ({ type, count }));
}

function App() {
  const [fwdSpeed, setFwdSpeed] = useState(150);
  const [fwdTime, setFwdTime] = useState(5);
  const [turnSpeed, setTurnSpeed] = useState(120);
  const [turnTime, setTurnTime] = useState(2);
  const [pan, setPan] = useState(90);
  const [tilt, setTilt] = useState(90);
  const [messages, setMessages] = useState([]);
  const wsRef = useRef(null);
  const [tab, setTab] = useState(0);
  const [logSessionActive, setLogSessionActive] = useState(false);
  const [logData, setLogData] = useState('');
  const [pieData, setPieData] = useState([]);
  const [includedTypes, setIncludedTypes] = useState(new Set());
  const logIntervalRef = useRef();
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [newSessionLabel, setNewSessionLabel] = useState("");

  // Persistent cards state
  const [activeCards, setActiveCards] = useState(() => {
    const saved = localStorage.getItem('rov_cards');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return DEFAULT_CARDS;
      }
    }
    return DEFAULT_CARDS;
  });

  // Save to localStorage on change
  useEffect(() => {
    localStorage.setItem('rov_cards', JSON.stringify(activeCards));
  }, [activeCards]);

  // FAB menu state
  const [fabAnchor, setFabAnchor] = useState(null);
  const openFabMenu = (e) => setFabAnchor(e.currentTarget);
  const closeFabMenu = () => setFabAnchor(null);

  // Add card
  const handleAddCard = (type) => {
    // Use a unique id for each card type (only one of each for now)
    if (!activeCards.find(c => c.type === type)) {
      const def = DEFAULT_CARDS.find(c => c.type === type);
      setActiveCards([...activeCards, { ...def, id: type }]);
    }
    closeFabMenu();
  };

  // Remove card
  const handleRemoveCard = (id) => {
    setActiveCards(cards => cards.filter(c => c.id !== id));
  };

  // Update card position
  const handleMoveCard = (id, newPos) => {
    setActiveCards(cards => cards.map(c => c.id === id ? { ...c, pos: newPos } : c));
  };

  // Update card lock
  const handleLockCard = (id, locked) => {
    setActiveCards(cards => cards.map(c => c.id === id ? { ...c, locked } : c));
  };

  // Real-time pan/tilt
  useEffect(() => {
    axios.post(`${API_URL}/command`, { left: 0, right: 0, pan, tilt });
  }, [pan, tilt]);

  // WebSocket for telemetry/messages
  useEffect(() => {
    wsRef.current = new WebSocket('ws://localhost:8000/ws');
    wsRef.current.onopen = () => console.log('Connected');
    wsRef.current.onclose = () => console.log('Disconnected');
    wsRef.current.onerror = () => console.log('Error');
    wsRef.current.onmessage = (e) => setMessages(msgs => [...msgs.slice(-9), e.data]);
    return () => wsRef.current.close();
  }, []);

  const sendCommand = (left, right, duration) => {
    axios.post(`${API_URL}/command`, { left, right: right * -1, pan, tilt });
    if (duration > 0) {
      setTimeout(() => {
        axios.post(`${API_URL}/command`, { left: 0, right: 0, pan, tilt });
      }, duration * 1000);
    }
  };

  // Remove old card position/lock state
  const handleStartPath = (moves) => {
    // TODO: send moves to rover, e.g. console.log(moves)
    console.log('Path moves:', moves);
  };

  const handleTabChange = (e, v) => setTab(v);

  const startLogSession = async () => {
    await axios.post(`${API_URL}/start-log-session`);
    setLogData('');
    setPieData([]);
    setIncludedTypes(new Set());
    setLogSessionActive(true);
    logIntervalRef.current = setInterval(fetchLogEntries, 2000);
  };
  const stopLogSession = async () => {
    await axios.post(`${API_URL}/end-log-session`);
    setLogSessionActive(false);
    if (logIntervalRef.current) clearInterval(logIntervalRef.current);
  };
  const fetchLogEntries = async () => {
    const res = await axios.get(`${API_URL}/log-entries`);
    if (res.data.ok) {
      setLogData(prev => prev + res.data.entries);
    }
  };
  useEffect(() => {
    if (!logSessionActive) return;
    const parsed = parseLogEntries(logData);
    setPieData(parsed);
    if (parsed.length && includedTypes.size === 0) {
      setIncludedTypes(new Set(parsed.map(d => d.type)));
    }
  }, [logData, logSessionActive, includedTypes.size]);

  const handleToggleType = (type) => {
    setIncludedTypes(prev => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type); else next.add(type);
      return next;
    });
  };

  // Function to start a new measurement session
  const startMeasurementSession = async () => {
    const res = await axios.post(`${API_URL}/start-measurement`, { label: newSessionLabel });
    setNewSessionLabel("");
    fetchLogEntries(); // Refresh log to include new session marker
  };

  // Parse log into sessions
  function parseSessions(logText) {
    const lines = logText.split('\n').filter(Boolean);
    const sessions = [];
    let current = null;
    for (const line of lines) {
      const sessionMatch = line.match(/^=== SESSION_START: (\S+)(.*)===$/);
      if (sessionMatch) {
        if (current) sessions.push(current);
        current = {
          session_id: sessionMatch[1],
          label: sessionMatch[2].trim(),
          lines: []
        };
      } else if (current) {
        current.lines.push(line);
      }
    }
    if (current) sessions.push(current);
    return sessions;
  }

  // Update sessions and pieData when logData changes
  useEffect(() => {
    const parsedSessions = parseSessions(logData);
    setSessions(parsedSessions);
    // Find the most recent session with detections
    const sessionWithDetections = parsedSessions.slice().reverse().find(s => s.lines.some(line => /class: /.test(line)));
    if (parsedSessions.length > 0 && !selectedSession) {
      setSelectedSession(sessionWithDetections ? sessionWithDetections.session_id : parsedSessions[parsedSessions.length - 1].session_id);
    }
    // Update pieData for selected session
    const session = parsedSessions.find(s => s.session_id === selectedSession);
    if (session) {
      const detections = session.lines.filter(line => /class: /.test(line));
      setPieData(parseLogEntries(detections.join('\n')));
      if (pieData.length && includedTypes.size === 0) {
        setIncludedTypes(new Set(pieData.map(d => d.type)));
      }
    } else {
      setPieData([]);
    }
  }, [logData, selectedSession, includedTypes.size]);

  // In App component state:
  const [plannerPath, setPlannerPath] = useState(() => {
    const saved = localStorage.getItem('rov_path_planner');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return [[0, 0]];
      }
    }
    return [[0, 0]];
  });
  // Persist plannerPath to localStorage
  useEffect(() => {
    localStorage.setItem('rov_path_planner', JSON.stringify(plannerPath));
  }, [plannerPath]);

  return (
    <ClickSpark
      sparkColor='#fff'
      sparkSize={10}
      sparkRadius={15}
      sparkCount={8}
      duration={400}
    >
      {/* --- Background Layer: Black + Particles --- */}
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          zIndex: -1,
          pointerEvents: 'none',
          background: '#000',
        }}
      />
      <Particles
        particleColors={['#ffffff', '#ffffff']}
        particleCount={200}
        particleSpread={20}
        speed={0.1}
        particleBaseSize={100}
        moveParticlesOnHover={true}
        alphaParticles={true}
        disableRotation={false}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          zIndex: -1,
          pointerEvents: 'none',
        }}
      />
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'fixed',
          top: 32,
          left: '50%',
          transform: 'translateX(-50%)',
          px: 4,
          py: 2,
          maxWidth: 600,
          background: 'rgba(30,30,40,0.85)',
          backdropFilter: 'blur(24px)',
          borderRadius: '20px',
          border: '1.5px solid rgba(0,200,255,0.25)',
          boxShadow: '0 4px 24px 0 rgba(0,80,255,0.18)',
          zIndex: 2,
        }}
      >
        <DirectionsCarIcon sx={{ mr: 2, color: '#00eaff', fontSize: 40, filter: 'drop-shadow(0 0 8px #00eaff88)' }} />
        <Typography
          variant="h3"
          sx={{
            color: '#eaf6ff',
            fontWeight: 800,
            fontFamily: 'Poppins, Arial, sans-serif',
            letterSpacing: 1,
            textShadow: '0 2px 16px #00eaff88, 0 2px 8px rgba(0,0,0,0.12)'
          }}
        >
          ROV Controller
        </Typography>
      </Box>

      <Tabs value={tab} onChange={handleTabChange} sx={{ mb: 2 }}>
        <Tab label="Main" />
      </Tabs>
      {tab === 0 && (
        <Box>
          {/* Render only selected cards */}
          {activeCards.map(card => {
            // Drag logic
            const dragRef = {};
            const drag = makeDraggable(card.pos, pos => handleMoveCard(card.id, pos), card.locked, dragRef);
            // Card close button
            const closeBtn = (
              <IconButton size="small" onClick={() => handleRemoveCard(card.id)} sx={{ color: '#F77C7C', ml: 1 }}
                onMouseDown={e => e.stopPropagation()} onTouchStart={e => e.stopPropagation()}>
                <CloseIcon />
              </IconButton>
            );
            // Card lock button
            const lockBtn = (
              <IconButton size="small" onClick={() => handleLockCard(card.id, !card.locked)} sx={{ color: '#00eaff', ml: 1 }}
                onMouseDown={e => e.stopPropagation()} onTouchStart={e => e.stopPropagation()}>
                {card.locked ? <LockIcon /> : <LockOpenIcon />}
              </IconButton>
            );
            // Render card by type
            if (card.type === 'move') {
              return (
                <Card key={card.id} sx={{ ...defaultCardStyle, ...drag.style, width: 400 }} {...dragHandlers(drag, card.locked)}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', userSelect: 'none' }}>
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 700, color: '#00eaff', textShadow: '0 0 8px #00eaff88', m: 0 }}>
                      Movement Settings
                    </Typography>
                    <Box>{lockBtn}{closeBtn}</Box>
                  </Box>
                  <Divider sx={{ mb: 2, bgcolor: '#00eaff44' }} />
                  <Typography gutterBottom sx={{ color: '#eaf6ff' }}>Forward/Backward Speed</Typography>
                  <Slider value={fwdSpeed} min={0} max={255} onChange={(_, v) => setFwdSpeed(v)} valueLabelDisplay="auto" sx={{ mb: 2, color: '#00eaff' }} />
                  <Typography gutterBottom sx={{ color: '#eaf6ff' }}>Forward/Backward Duration (s)</Typography>
                  <Slider value={fwdTime} min={1} max={10} onChange={(_, v) => setFwdTime(v)} valueLabelDisplay="auto" sx={{ mb: 2, color: '#00eaff' }} />
                  <Typography gutterBottom sx={{ color: '#eaf6ff' }}>Turn Speed</Typography>
                  <Slider value={turnSpeed} min={0} max={255} onChange={(_, v) => setTurnSpeed(v)} valueLabelDisplay="auto" sx={{ mb: 2, color: '#00eaff' }} />
                  <Typography gutterBottom sx={{ color: '#eaf6ff' }}>Turn Duration (s)</Typography>
                  <Slider value={turnTime} min={1} max={10} onChange={(_, v) => setTurnTime(v)} valueLabelDisplay="auto" sx={{ mb: 2, color: '#00eaff' }} />
                </Card>
              );
            }
            if (card.type === 'pan') {
              return (
                <Card key={card.id} sx={{ ...defaultCardStyle, ...drag.style, width: 400 }} {...dragHandlers(drag, card.locked)}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', userSelect: 'none' }}>
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 700, color: '#00eaff', textShadow: '0 0 8px #00eaff88', m: 0 }}>
                      Pan & Tilt
                    </Typography>
                    <Box>{lockBtn}{closeBtn}</Box>
                  </Box>
                  <Divider sx={{ mb: 2, bgcolor: '#00eaff44' }} />
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                    <PanTiltBox pan={pan} tilt={tilt} setPan={setPan} setTilt={setTilt} />
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="body1" sx={{ color: '#eaf6ff' }}>Current Pan: <b>{pan}°</b></Typography>
                      <Typography variant="body1" sx={{ color: '#eaf6ff' }}>Current Tilt: <b>{tilt}°</b></Typography>
                    </Box>
                    <Typography variant="caption" sx={{ color: '#b2eaff' }}>Drag the pointer to control pan/tilt in real time</Typography>
                  </Box>
                </Card>
              );
            }
            if (card.type === 'ctrl') {
              return (
                <Card key={card.id} sx={{ ...defaultCardStyle, ...drag.style, width: 400 }} {...dragHandlers(drag, card.locked)}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', userSelect: 'none' }}>
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 700, color: '#00eaff', textShadow: '0 0 8px #00eaff88', m: 0 }}>
                      Controls
                    </Typography>
                    <Box>{lockBtn}{closeBtn}</Box>
                  </Box>
                  <Divider sx={{ mb: 2, bgcolor: '#00eaff44' }} />
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                    <ButtonGroup variant="contained" sx={{ mb: 2, borderRadius: 3, boxShadow: 4, overflow: 'hidden' }}>
                      <Button
                        size="large"
                        onClick={() => sendCommand(fwdSpeed, fwdSpeed, fwdTime)}
                        sx={{ fontWeight: 800, fontSize: 26, px: 6, py: 2, background: '#00eaff', color: '#222', borderRadius: 0, boxShadow: '0 4px 16px 0 #00eaff44', transition: 'background 0.2s, box-shadow 0.2s', '&:hover': { background: '#00b8d4', boxShadow: '0 6px 24px 0 #00eaff88' } }}
                      >
                        ⬆️ Forward
                      </Button>
                    </ButtonGroup>
                    <ButtonGroup variant="contained" sx={{ mb: 2, borderRadius: 3, boxShadow: 4, overflow: 'hidden' }}>
                      <Button
                        size="large"
                        onClick={() => sendCommand(-turnSpeed, turnSpeed, turnTime)}
                        sx={{ fontWeight: 800, fontSize: 26, px: 4, py: 2, background: '#1e90ff', color: '#fff', borderRadius: 0, boxShadow: '0 4px 16px 0 #1e90ff44', transition: 'background 0.2s, box-shadow 0.2s', '&:hover': { background: '#1565c0', boxShadow: '0 6px 24px 0 #1e90ff88' } }}
                      >
                        ⬅️ Left
                      </Button>
                      <Button
                        size="large"
                        color="error"
                        onClick={() => sendCommand(0, 0, 0)}
                        sx={{ fontWeight: 800, fontSize: 26, px: 4, py: 2, background: '#263859', color: '#fff', borderRadius: 0, boxShadow: '0 4px 16px 0 #26385944', transition: 'background 0.2s, box-shadow 0.2s', '&:hover': { background: '#1a2233', boxShadow: '0 6px 24px 0 #26385988' } }}
                      >
                        ⏹️ Stop
                      </Button>
                      <Button
                        size="large"
                        onClick={() => sendCommand(turnSpeed, -turnSpeed, turnTime)}
                        sx={{ fontWeight: 800, fontSize: 26, px: 4, py: 2, background: '#1e90ff', color: '#fff', borderRadius: 0, boxShadow: '0 4px 16px 0 #1e90ff44', transition: 'background 0.2s, box-shadow 0.2s', '&:hover': { background: '#1565c0', boxShadow: '0 6px 24px 0 #1e90ff88' } }}
                      >
                        ➡️ Right
                      </Button>
                    </ButtonGroup>
                    <ButtonGroup variant="contained" sx={{ borderRadius: 3, boxShadow: 4, overflow: 'hidden' }}>
                      <Button
                        size="large"
                        onClick={() => sendCommand(-fwdSpeed, -fwdSpeed, fwdTime)}
                        sx={{ fontWeight: 800, fontSize: 26, px: 6, py: 2, background: '#00eaff', color: '#222', borderRadius: 0, boxShadow: '0 4px 16px 0 #00eaff44', transition: 'background 0.2s, box-shadow 0.2s', '&:hover': { background: '#00b8d4', boxShadow: '0 6px 24px 0 #00eaff88' } }}
                      >
                        ⬇️ Backward
                      </Button>
                    </ButtonGroup>
                  </Box>
                </Card>
              );
            }
            if (card.type === 'msg') {
              return (
                <Card key={card.id} sx={{ ...defaultCardStyle, ...drag.style, width: 400 }} {...dragHandlers(drag, card.locked)}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', userSelect: 'none' }}>
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 700, color: '#00eaff', textShadow: '0 0 8px #00eaff88', m: 0 }}>
                      Messages from Car
                    </Typography>
                    <Box>{lockBtn}{closeBtn}</Box>
                  </Box>
                  <Divider sx={{ mb: 2, bgcolor: '#00eaff44' }} />
                  <Box sx={{ maxHeight: 200, overflowY: 'auto', bgcolor: 'rgba(30,30,40,0.7)', p: 1, borderRadius: 1 }}>
                    {messages.length === 0 ? <Typography sx={{ color: '#eaf6ff' }}>No messages yet.</Typography> :
                      messages.map((m, i) => <Typography key={i} sx={{ fontFamily: 'monospace', fontSize: 14, color: '#eaf6ff' }}>{m}</Typography>)}
                  </Box>
                </Card>
              );
            }
            if (card.type === 'path') {
              return (
                <PathPlannerCard
                  key={card.id}
                  pos={card.pos}
                  setPos={pos => handleMoveCard(card.id, pos)}
                  locked={card.locked}
                  setLocked={locked => handleLockCard(card.id, locked)}
                  onStartPath={handleStartPath}
                  fwdTime={fwdTime}
                  turnTime={turnTime}
                  fwdSpeed={fwdSpeed}
                  turnSpeed={turnSpeed}
                  onClose={() => handleRemoveCard(card.id)}
                  path={plannerPath}
                  setPath={setPlannerPath}
                />
              );
            }
            if (card.type === 'joy') {
              return (
                <JoystickCard
                  key={card.id}
                  pos={card.pos}
                  setPos={pos => handleMoveCard(card.id, pos)}
                  locked={card.locked}
                  setLocked={locked => handleLockCard(card.id, locked)}
                  onClose={() => handleRemoveCard(card.id)}
                  fwdSpeed={fwdSpeed}
                  turnSpeed={turnSpeed}
                />
              );
            }
            if (card.type === 'cam') {
              return (
                <CameraFeedCard
                  key={card.id}
                  pos={card.pos}
                  setPos={pos => handleMoveCard(card.id, pos)}
                  locked={card.locked}
                  setLocked={locked => handleLockCard(card.id, locked)}
                  onClose={() => handleRemoveCard(card.id)}
                />
              );
            }
            if (card.type === 'chart') {
              return (
                <Card key={card.id} sx={{ ...defaultCardStyle, ...drag.style, width: 480 }} {...dragHandlers(drag, card.locked)}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', userSelect: 'none' }}>
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 700, color: '#00eaff', textShadow: '0 0 8px #00eaff88', m: 0 }}>
                      Detection Chart
                    </Typography>
                    <Box>{lockBtn}{closeBtn}</Box>
                  </Box>
                  <Divider sx={{ mb: 2, bgcolor: '#00eaff44' }} />
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <select value={selectedSession || ''} onChange={e => setSelectedSession(e.target.value)}>
                      {sessions.map(s => (
                        <option key={s.session_id} value={s.session_id}>
                          {s.label ? `${s.label} (${s.session_id})` : s.session_id}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      placeholder="New session label (optional)"
                      value={newSessionLabel}
                      onChange={e => setNewSessionLabel(e.target.value)}
                    />
                    <Button variant="contained" color="primary" onClick={startMeasurementSession}>
                      Start New Measurement
                    </Button>
                  </Box>
                  <DetectionPieChart
                    data={pieData}
                    includedTypes={includedTypes}
                    onToggleType={handleToggleType}
                  />
                  {pieData.length === 0 && (
                    <Typography sx={{ color: '#F77C7C', mt: 2, textAlign: 'center' }}>
                      No detections in this session yet.
                    </Typography>
                  )}
                </Card>
              );
            }
            return null;
          })}

          {/* Floating Action Button for adding cards */}
          <Fab color="info" aria-label="add" sx={{ position: 'fixed', bottom: 32, right: 32, zIndex: 10 }} onClick={openFabMenu}>
            <AddIcon />
          </Fab>
          <Menu anchorEl={fabAnchor} open={!!fabAnchor} onClose={closeFabMenu}>
            {CARD_TYPES.filter(c => !activeCards.find(a => a.type === c.type)).map(c => (
              <MenuItem key={c.type} onClick={() => handleAddCard(c.type)}>{c.label}</MenuItem>
            ))}
            {CARD_TYPES.filter(c => !activeCards.find(a => a.type === c.type)).length === 0 && (
              <MenuItem disabled>All cards added</MenuItem>
            )}
          </Menu>

          <Box sx={{ mt: 4, textAlign: 'center', color: '#F77C7C', opacity: 0.8 }}>
            <Divider sx={{ mb: 2, bgcolor: '#F77C7C' }} />
            <Typography variant="body2">ROV Controller &copy; {new Date().getFullYear()} | Powered by React & Material UI</Typography>
          </Box>
        </Box>
      )}
    </ClickSpark>
  );
}

// List of all possible cards
const CARD_TYPES = [
  { type: 'move', label: 'Movement Settings' },
  { type: 'pan', label: 'Pan & Tilt' },
  { type: 'ctrl', label: 'Controls' },
  { type: 'msg', label: 'Messages from Car' },
  { type: 'path', label: 'Path Planner' },
  { type: 'joy', label: 'Joystick' },
  { type: 'cam', label: 'Camera Feed' },
  { type: 'chart', label: 'Detection Chart' },
];

// Default layout
const DEFAULT_CARDS = [
  { id: 'move', type: 'move', pos: { top: 120, left: 40 }, locked: false },
  { id: 'pan', type: 'pan', pos: { bottom: 40, left: 40 }, locked: false },
  { id: 'ctrl', type: 'ctrl', pos: { top: 120, right: 40 }, locked: false },
  { id: 'msg', type: 'msg', pos: { bottom: 40, right: 40 }, locked: false },
  { id: 'path', type: 'path', pos: { top: 120, left: 400 }, locked: false },
  { id: 'joy', type: 'joy', pos: { bottom: 40, left: 240 }, locked: false },
  { id: 'cam', type: 'cam', pos: { top: 120, left: 800 }, locked: false },
  { id: 'chart', type: 'chart', pos: { top: 120, left: 600 }, locked: false },
];

export default App; 
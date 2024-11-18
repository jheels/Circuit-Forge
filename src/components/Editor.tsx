import { useState, useEffect, useRef } from 'react';
import { useDrop } from 'react-dnd';
import { Stage, Layer, Rect, Text } from 'react-konva';
import { useSidebar } from '@/context/SidebarContext';
import { v4 as uuidv4 } from 'uuid';

const Editor = () => {
    const { isOpen } = useSidebar();
    const [stageWidth, setStageWidth] = useState(isOpen ? window.innerWidth * 0.8 : window.innerWidth - 12);
    const [stageHeight, setStageHeight] = useState(window.innerHeight - 100); // 100 is the height of the header
    const [scale, setScale] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [components, setComponents] = useState([]);
    const stageRef = useRef(null);


    const MIN_SCALE = 0.25;
    const MAX_SCALE = 3;

    useEffect(() => {
        const handleResize = () => {
            setStageWidth(isOpen ? window.innerWidth * 0.8 : window.innerWidth - 12);
            setStageHeight(window.innerHeight - 100);
        };
        window.addEventListener('resize', handleResize);
        handleResize();

        return () => window.removeEventListener('resize', handleResize);
    }, [isOpen]);

    const handleWheel = (e) => {
        e.evt.preventDefault();
        const scaleBy = 1.1;
        const stage = e.target.getStage();
        const oldScale = stage.scaleX();

        const mousePointTo = {
            x: stage.getPointerPosition().x / oldScale - stage.x() / oldScale,
            y: stage.getPointerPosition().y / oldScale - stage.y() / oldScale,
        };

        let newScale = e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy;
        newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, newScale));
        setScale(newScale);

        const newPos = {
            x: -(mousePointTo.x - stage.getPointerPosition().x / newScale) * newScale,
            y: -(mousePointTo.y - stage.getPointerPosition().y / newScale) * newScale,
        };
        setPosition(newPos);
    };

    const [{ isOver }, drop] = useDrop(() => ({
        accept: 'COMPONENT',
        drop: (item, monitor) => {
            const point = monitor.getSourceClientOffset();
            const objHeight = 100; // this is the rectangles height for now 
            const newId = `${item.name} - ${uuidv4()}`;
            setComponents(prevComponents => {
                console.log(newId)
                return [...prevComponents, { id: newId , name: item.name, x: point.x, y: point.y - objHeight}];
            });
        },
        collect: (monitor) => ({
            isOver: monitor.isOver,
        }),
    }));

    return (
        <div className="flex-grow" ref={drop}>
            <Stage
                ref={stageRef}
                className="border-2 border-dashed border-black"
                width={stageWidth}
                height={stageHeight}
                scale={{ x: scale, y: scale }}
                x={position.x}
                y={position.y}
                onWheel={handleWheel}
                draggable
            >
                <Layer>
                    <Text text="Editable Area" fontSize={15} x={10} y={10} />
                    {components.map((component) => (
                        <Rect
                            key={component.id}
                            x={component.x}
                            y={component.y}
                            width={100}
                            height={100}
                            fill="blue"
                            draggable
                        />
                    ))}
                </Layer>
            </Stage>
        </div>
    );
};

export default Editor;

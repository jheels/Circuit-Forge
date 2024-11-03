import { useState, useEffect } from 'react';
import { Stage, Layer, Rect, Text } from 'react-konva';

const Editor = () => {
    const [stageWidth, setStageWidth] = useState(window.innerWidth * 0.8);
    const [stageHeight, setStageHeight] = useState(window.innerHeight - 100); // 100 is the height of the header
    const [scale, setScale] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });

    const MIN_SCALE = 0.25;
    const MAX_SCALE = 3;

    useEffect(() => {
        const handleResize = () => {
            setStageWidth(window.innerWidth * 0.8);
            setStageHeight(window.innerHeight - 100);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const handleWheel = (e) => {
        e.evt.preventDefault();
        const scaleBy = 1.1;
        const stage = e.target.getStage();
        const oldScale = stage.scaleX();

        const mousePointTo = {
            x: stage.getPointerPosition().x / oldScale - stage.x() / oldScale,
            y: stage.getPointerPosition().y / oldScale - stage.y() / oldScale,
        };

        let newScale  = e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy;
        newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, newScale));
        setScale(newScale);

        const newPos = {
            x: -(mousePointTo.x - stage.getPointerPosition().x / newScale) * newScale,
            y: -(mousePointTo.y - stage.getPointerPosition().y / newScale) * newScale,
        };
        setPosition(newPos);
    };

    return (
        <div className="flex-grow">
            <Stage
                className="border-2 border-dashed border-black"
                width={stageWidth}
                height={stageHeight}
                scaleX={scale}
                scaleY={scale}
                x={position.x}
                y={position.y}
                onWheel={handleWheel}
                draggable
            >
                <Layer>
                    <Text text="Editable Area" fontSize={15} x={10} y={10} />
                    <Rect
                        x={20}
                        y={20}
                        width={100}
                        height={100}
                        fill="red"
                        draggable
                    />
                </Layer>
            </Stage>
        </div>
    );
};

export default Editor;

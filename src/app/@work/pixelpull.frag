uniform lowp sampler2D perturbationMap;

uniform float t;
uniform bool isActive;
uniform int direction;
uniform bool pullToBackground;
uniform vec4 backgroundColor;
uniform float pixelSelectionRandomBlend;
uniform int pixelSelectionMode; // 0 - Select bright pixels , 1 - Select dark pixels, 2 - Select red pixels, 3 - select green pixels, 4, select blue pixels
uniform float minSpeed;
uniform float maxSpeed;
uniform float minLength;
uniform float maxLength;
uniform bool noEnd;

bool scanCondition(int i, float ts, int direction) {
	if(direction == 0 || direction == 1)
	{
		return i >= 0;
	}
	else
	{
		return i <= int(1.0 / ts);
	}
}

bool endCondition(int i, float ts, int direction) {
	if(direction == 0 || direction == 1)
	{
		return i == 0;
	}
	else
	{
		return i == int(1.0 / ts);
	}
}

vec2 getUV(float currenttc, float otc, int direction) {
	if(direction == 0 || direction == 2)
	{
		return vec2(currenttc, otc);
	}
	else
	{
		return vec2(otc, currenttc);
	}
}

vec2 getDisplacementUV(float currenttc, float otc, float displacement, int direction) {
	if(direction == 0 || direction == 2)
	{
		return vec2(currenttc - displacement, otc);
	}
	else
	{
		return vec2(otc, currenttc - displacement);
	}
}

bool checkOver(int startPosition, int endPosition, int pixelPosition, int direction)  {
	if(direction == 0 || direction == 1)
	{
		return startPosition >= pixelPosition && endPosition <= pixelPosition && endPosition != startPosition;
	}
	else
	{
		return startPosition <= pixelPosition && endPosition >= pixelPosition && endPosition != startPosition;
	}
}

bool checkBefore(int startPosition, int endPosition, int pixelPosition, int direction)  {
	if(direction == 0 || direction == 1)
	{
		return endPosition <= pixelPosition;
	}
	else
	{
		return endPosition >= pixelPosition;
	}
}

bool notAtStart(int index, float ts, int direction) {
	if(direction == 0 || direction == 1)
	{
		return index > 0;
	}
	else
	{
		return index < int(1.0 / ts);
	}
}

int getEmittingPosition(float tc, float speed, float emitting, float ts, int direction) {
	if(direction == 0 || direction == 1)
	{
		return int((tc + speed * max(0.0, t - emitting)) / ts);
	}
	else
	{
		return int((tc - speed * max(0.0, t - emitting)) / ts);
	}
}

void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
	
	if(isActive)
	{
		float tc; //texture coordinate
		float otc; //other texture coordinate
		float ts; //texel size, as a percentage
		int inc; //increment
		float start;

		//We set the various variables in such a way that they are direction
		//agnostic, so we can use the same code for any direction
		if(direction == 0)
		{
			tc = vUv.s;
			otc = vUv.t;
			ts = texelSize.x * 2.0;
			inc = 1;
			start = tc;
		}
		else if(direction == 1)
		{
			tc = vUv.t;
			otc = vUv.s;
			ts = texelSize.y * 2.0;
			inc = 1;
			start = tc;
		}
		else if(direction == 2)
		{
			tc = vUv.s;
			otc = vUv.t;
			ts = texelSize.x * 2.0;
			inc = -1;
			start = tc;
		}
		else if(direction == 3)
		{
			tc = vUv.t;
			otc = vUv.s;
			ts = texelSize.y * 2.0;
			inc = -1;
			start = tc;
		}

		int pixelPosition = int(tc / ts);
		
		int startCheckPosition = int(start / ts);

		vec4 color = inputColor;
		int lowestPixel = pixelPosition;
		bool doDisappear = true;
		
		vec3 testColor = vec3(tc);

		// Checking the current pixel to see if a pulled pixel before it is now overlapping it
		// We assume that pulled pixel furthest away "wins" over closer pixel pulls.
		// This loop is direction agnostic. 

		for(int i = startCheckPosition; scanCondition(i, ts, direction); i -= inc)
		{
			bool doSkip = false; //This is to allow proper setting of background color when skpping pixel pulls if we pullToBackground
			float currenttc = float(i) * ts;
			vec2 previousPositionUV = getUV(currenttc, otc, direction); // We need to get the uv value irrespective of direction

			if(texture(perturbationMap, previousPositionUV).a < 0.95 && !endCondition(i, ts, direction)) //skip 90% of pixels, allows a sparser look and more performant
			{
				if(pullToBackground)
				{
					doSkip = true;
				}
				else if(notAtStart(i, ts, direction))
				{
					continue;
				}
			}

			float speed = texture(perturbationMap, previousPositionUV).b * (maxSpeed - minSpeed) + minSpeed;

			float length = texture(perturbationMap, previousPositionUV).b * (maxLength - minLength) + minLength;

			float displacement = 1.0;

			//The time between 0 and 1 at which the pixel starts trailing
			
			float startEmitting;

			float r = texture(inputBuffer, previousPositionUV).r;
			float g = texture(inputBuffer, previousPositionUV).g;
			float b = texture(inputBuffer, previousPositionUV).b;
			float brightness = (0.21 * r) + (0.72 * g) + (0.07 * b);
			if(pixelSelectionMode == 0)
			{
				startEmitting = pixelSelectionRandomBlend * texture(perturbationMap, previousPositionUV).r + (1.0 - pixelSelectionRandomBlend) * (1.0 - brightness);
			}
			else if (pixelSelectionMode == 1)
			{
				startEmitting = pixelSelectionRandomBlend * texture(perturbationMap, previousPositionUV).r + (1.0 - pixelSelectionRandomBlend) * (brightness);
			}
			else if (pixelSelectionMode == 2)
			{
				startEmitting = pixelSelectionRandomBlend * texture(perturbationMap, previousPositionUV).r + (1.0 - pixelSelectionRandomBlend) * (1.0 - r);
			}
			else if (pixelSelectionMode == 3)
			{
				startEmitting = pixelSelectionRandomBlend * texture(perturbationMap, previousPositionUV).r + (1.0 - pixelSelectionRandomBlend) * (1.0 - g);
			}
			else if (pixelSelectionMode == 4)
			{
				startEmitting = pixelSelectionRandomBlend * texture(perturbationMap, previousPositionUV).r + (1.0 - pixelSelectionRandomBlend) * (1.0 - b);
			}
			startEmitting = clamp(startEmitting, 0.0, 1.0);

			//Multiply so that you don't get any pulls that can't possibly finish in time
			//What would be the latest start time for the end of an pull to reach the end 

			float mulitplier = max(0.0, (minSpeed - 1.0 - maxLength) / minSpeed);
			startEmitting *= mulitplier;

			//The time between 0 and 1 at which the pixel trail stops trailing from the source
			float endEmitting = startEmitting + (length / speed);

			if(noEnd)
			{
				endEmitting = 1.0;
			}

			//int startPosition = int((currenttc + speed * max(0.0, t - startEmitting)) / ts);
			//int endPosition = int((currenttc + speed * max(0.0, t - endEmitting)) / ts);
			int startPosition = getEmittingPosition(currenttc, speed, startEmitting, ts, direction);
			int endPosition = getEmittingPosition(currenttc, speed, endEmitting, ts, direction);

			if(i == startCheckPosition)
			{
				if(t > endEmitting && pullToBackground)
				{
					color = backgroundColor;
				}
			}
			else
			{
				if(t > startEmitting)
				{
					if(!doSkip && checkOver(startPosition, endPosition, pixelPosition, direction)) 
					{
						lowestPixel = i;
					}
					if(startPosition == endPosition && startPosition == pixelPosition)
					{
						color = vec4(texture(inputBuffer, getDisplacementUV(tc, otc, displacement, direction)).rgb, 1.0);
					}
				}
				if(!doSkip && pullToBackground && doDisappear && checkBefore(startPosition, endPosition, pixelPosition, direction))
				{
					doDisappear = false;
				}
			}
		}
		
		if(lowestPixel != pixelPosition)
		{
			float lowesttc = float(lowestPixel) * ts; 
			vec2 lowestUV = getUV(lowesttc, otc, direction);
			color = vec4(texture(inputBuffer, lowestUV).rgb, 1.0);
		}
		if(doDisappear)
		{
			if(pullToBackground)
			{
				color = backgroundColor;
			}
			else
			{
				color = inputColor;
			}
		}

		outputColor = color;
		//outputColor = vec4(testColor, 1.0);
	}
	else
	{
		vec3 inTexture = texture(inputBuffer, vUv).rgb;
		outputColor = vec4(inTexture, 1.0);
	}
}
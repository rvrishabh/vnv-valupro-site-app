import {
  distanceMetres,
  facingDirection,
  headingQuadrant,
  latLngToTile,
  normalizeHeading,
} from '../src/utils/geo.utils';

describe('compass labels', () => {
  it('matches the reference stamp: 166° reads "SE" and faces South', () => {
    expect(headingQuadrant(166)).toBe('SE');
    expect(facingDirection(166)).toBe('South');
  });

  it('uses the exact cardinal near N/E/S/W and wraps around 360°', () => {
    expect(headingQuadrant(358)).toBe('N');
    expect(headingQuadrant(92)).toBe('E');
    expect(facingDirection(-10)).toBe('North');
    expect(facingDirection(225)).toBe('South-West');
    expect(normalizeHeading(-90)).toBe(270);
  });
});

describe('map math', () => {
  it('puts Noida Sector 107 on the expected zoom-17 tile', () => {
    const { x, y } = latLngToTile(28.54963, 77.377195, 17);
    expect(Math.floor(x)).toBe(93708);
    expect(Math.floor(y)).toBe(54682);
  });

  it('measures short distances in metres', () => {
    const a = { latitude: 28.54963, longitude: 77.377195 };
    const b = { latitude: 28.55053, longitude: 77.377195 };
    expect(distanceMetres(a, b)).toBeGreaterThan(95);
    expect(distanceMetres(a, b)).toBeLessThan(105);
  });
});

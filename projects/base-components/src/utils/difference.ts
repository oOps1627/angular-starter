import * as _ from 'underscore';

export function difference(object: any, base: any) {
  const changes = (objectModified: any, baseModified: any) => (
    _.pick(
      _.mapObject(objectModified, (value: any, key: any) => {
        return (
          (!_.isEqual(value, baseModified[key])) ? value : null
        );
      }),
      (value: any) => (value !== null)
    )
  );

  return changes(object, base);
}

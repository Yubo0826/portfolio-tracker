import { definePreset } from '@primeuix/themes';
import Aura from '@primeuix/themes/aura';

export default definePreset(Aura, {
    semantic: {
      primary: {
        50: '{indigo.50}',
        100: '{indigo.100}',
        200: '{indigo.200}',
        300: '{indigo.300}',
        400: '{indigo.400}',
        500: '{indigo.500}',
        600: '{indigo.600}',
        700: '{indigo.700}',
        800: '{indigo.800}',
        900: '{indigo.900}',
        950: '{indigo.950}'
      },
      /*
          定義明暗模式用的顏色，顏色值可以參考這裡：
          https://primevue.org/theming/styled/#colors
      */
      colorScheme: {
        light: {
          primary: {
            color: '{indigo.500}',
            contrastColor: '#ffffff',
            hoverColor: '{indigo.600}',
            activeColor: '{indigo.700}'
          },
          surface: {
              0: '#ffffff',
              50: '{zinc.50}',
              100: '{zinc.100}',
              200: '{zinc.200}',
              300: '{zinc.300}',
              400: '{zinc.400}',
              500: '{zinc.500}',
              600: '{zinc.600}',
              700: '{zinc.700}',
              800: '{zinc.800}',
              900: '{zinc.900}',
              950: '{zinc.950}'
          },
          text: {
            color: '{slate.600}',
          },
          custom: {
            // 可以在這裡定義自訂的token
          }
        },
        dark: {
          primary: {
            color: '{indigo.400}',
            contrastColor: '#ffffff',
            hoverColor: '{indigo.300}',
            activeColor: '{indigo.200}'
          },
          surface: {
            background: '#282832',
            0: '#ffffff',
            50: '{slate.50}',
            100: '{slate.100}',
            200: '{slate.200}',
            300: '{slate.300}',
            400: '{slate.400}',
            500: '{slate.500}',
            600: '{slate.600}',
            700: '{slate.700}',
            800: '{slate.800}',
            900: '{slate.900}',
            950: '{slate.950}'
          },
          text: {
            color: '{zinc.100}',
        }
      }
    },
    // 可以進一步針對特定元件覆寫樣式
    components: {
      button: {
        background: '{primary.color}',
        color: '{primary.contrastColor}',
        outlined: {
          border: {
            color: '{primary.color}'
          }
        }
      },
      card: {
        background: '{surface.background}',
        colorScheme: {
          light: {
            background: '{surface.background}',
            color: '{surface.textColor}'
          },
          dark: {
            background: '{surface.background}',
            color: '{surface.textColor}'
          }
        }
      },
      dataTable: {
        colorScheme: {
          background: '{surface.background}',
          headerBackground: '{surface.background}',
          headerCellBackground: '{surface.background}',
          headerCellBorderColor: '{zinc.200}',
          headerColor: '{zinc.800}',
          rowBackground: '{surface.background}',
          rowHoverBackground: '{primary.hoverColor}',
        }
      },
    }
  }
})

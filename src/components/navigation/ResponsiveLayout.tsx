import React, { useState, ReactNode } from 'react';
import {
  View,
  StyleSheet,
  useWindowDimensions,
  Modal,
  TouchableWithoutFeedback,
  Platform,
} from 'react-native';
import { AppHeader } from './AppHeader';
import { AppSidebar } from './AppSidebar';
import { colors } from '../../theme';

interface ResponsiveLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  breadcrumb?: string;
  currentRoute?: string;
  onNavigate?: (screen: string) => void;
  showBreadcrumbs?: boolean;
}

export const ResponsiveLayout: React.FC<ResponsiveLayoutProps> = ({
  children,
  title,
  subtitle,
  breadcrumb,
  currentRoute = 'Dashboard',
  onNavigate,
  showBreadcrumbs = true,
}) => {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;
  const isTablet = width >= 768 && width < 1024;
  const isMobile = width < 768;

  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  return (
    <View style={styles.rootContainer}>
      {/* 1. Desktop Sidebar */}
      {isDesktop && (
        <AppSidebar
          currentRoute={currentRoute}
          onNavigate={onNavigate}
        />
      )}

      {/* 2. Main Work Area (Header + Page Content) */}
      <View style={styles.workArea}>
        <AppHeader
          title={title}
          subtitle={subtitle}
          breadcrumb={showBreadcrumbs ? (breadcrumb || title || currentRoute) : undefined}
          showLogo={isMobile || isTablet}
          showDrawerButton={!isDesktop}
          onOpenDrawer={() => setMobileDrawerOpen(true)}
        />

        <View style={styles.pageContentContainer}>
          {children}
        </View>
      </View>

      {/* 3. Mobile / Tablet Drawer Modal */}
      {!isDesktop && (
        <Modal
          visible={mobileDrawerOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setMobileDrawerOpen(false)}
        >
          <TouchableWithoutFeedback onPress={() => setMobileDrawerOpen(false)}>
            <View style={styles.drawerOverlay}>
              <TouchableWithoutFeedback>
                <View style={styles.drawerCard}>
                  <AppSidebar
                    currentRoute={currentRoute}
                    onNavigate={(screen) => {
                      setMobileDrawerOpen(false);
                      if (onNavigate) onNavigate(screen);
                    }}
                    isMobileDrawer={true}
                    onCloseDrawer={() => setMobileDrawerOpen(false)}
                  />
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
  },
  workArea: {
    flex: 1,
    flexDirection: 'column',
    backgroundColor: '#F8FAFC',
  },
  pageContentContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  drawerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    flexDirection: 'row',
  },
  drawerCard: {
    width: 280,
    height: '100%',
    backgroundColor: '#FFFFFF',
  },
});

export default ResponsiveLayout;
